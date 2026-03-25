import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ error: 'No session id' }, { status: 400 })

    const stripe = getStripe()

    let session
    try {
      session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription', 'customer']
      })
    } catch (stripeErr) {
      console.error('Stripe retrieve error:', stripeErr)
      return NextResponse.json({ error: 'Could not retrieve session from Stripe' }, { status: 400 })
    }

    console.log('Session id:', session.id)
    console.log('Session status:', session.status)
    console.log('Session payment_status:', session.payment_status)
    console.log('Session metadata:', JSON.stringify(session.metadata))
    console.log('Session customer:', session.customer)
    console.log('Session subscription:', session.subscription)

    // Accept both complete status and paid payment_status
    const isValid = session.status === 'complete' || session.payment_status === 'paid'
    if (!isValid) {
      console.error('Session not valid. Status:', session.status, 'Payment status:', session.payment_status)
      return NextResponse.json({
        error: `Payment not completed. Status: ${session.status}, Payment: ${session.payment_status}`
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = session.metadata?.supabase_user_id
    console.log('User id from metadata:', userId)

    let subscriptionId = null
    let periodEnd = null

    if (session.subscription) {
      try {
        const sub = typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : session.subscription as any
        subscriptionId = sub.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        periodEnd = new Date((sub as any).current_period_end * 1000).toISOString()
      } catch (subErr) {
        console.error('Subscription retrieve error:', subErr)
      }
    }

    const updateData = {
      subscription_status: 'active',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id,
      stripe_subscription_id: subscriptionId,
      subscription_period_end: periodEnd,
    }

    if (userId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (updateError) {
        console.error('Supabase update error by userId:', updateError)
        return NextResponse.json({ error: 'Database update failed: ' + updateError.message }, { status: 500 })
      }

      console.log('Successfully activated for userId:', userId)
      return NextResponse.json({ success: true })
    }

    // Fallback by customer id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id
    if (customerId) {
      const { data: profileByCustomer } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profileByCustomer) {
        await supabase.from('profiles').update(updateData).eq('id', profileByCustomer.id)
        console.log('Activated by customer id:', customerId)
        return NextResponse.json({ success: true })
      }
    }

    // Last fallback - find by email
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customer = typeof session.customer === 'object' ? session.customer as any : null
      const email = customer?.email
      if (email) {
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const match = users.find(u => u.email === email)
        if (match) {
          await supabase.from('profiles').update(updateData).eq('id', match.id)
          console.log('Activated by email fallback:', email)
          return NextResponse.json({ success: true })
        }
      }
    } catch (emailErr) {
      console.error('Email fallback error:', emailErr)
    }

    return NextResponse.json({ error: 'Could not find user to activate' }, { status: 404 })

  } catch (err) {
    console.error('Activate error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
