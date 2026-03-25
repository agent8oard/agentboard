import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ error: 'No session id' }, { status: 400 })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = session.metadata?.supabase_user_id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function getSubscriptionFields(subscriptionId: string | null | undefined): Promise<Record<string, any>> {
      if (!subscriptionId) return {}
      const sub = await getStripe().subscriptions.retrieve(subscriptionId)
      return {
        stripe_subscription_id: sub.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscription_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      }
    }

    if (!userId) {
      // Fallback: find profile by stripe_customer_id already stored during checkout
      const { data: profileByCustomer } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', session.customer as string)
        .single()

      if (profileByCustomer) {
        const subFields = await getSubscriptionFields(session.subscription as string | null)
        await supabase.from('profiles').update({
          subscription_status: 'active',
          ...subFields,
        }).eq('id', profileByCustomer.id)
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subFields = await getSubscriptionFields(session.subscription as string | null)
    await supabase.from('profiles').update({
      subscription_status: 'active',
      stripe_customer_id: session.customer as string,
      ...subFields,
    }).eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Activate error:', err)
    return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
  }
}
