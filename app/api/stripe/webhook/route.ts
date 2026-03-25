export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// current_period_end lives on the subscription but typing varies across SDK versions
function periodEnd(sub: Stripe.Subscription): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ts: number = (sub as any).current_period_end
  return new Date(ts * 1000).toISOString()
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('Checkout session completed:', JSON.stringify(session.metadata))
    console.log('Customer:', session.customer)
    console.log('Subscription:', session.subscription)

    const userId = session.metadata?.supabase_user_id

    if (session.subscription) {
      const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)

      const profileUpdate = {
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: 'active',
        subscription_period_end: periodEnd(subscription),
      }

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId)

        console.log('Updated profile by userId:', userId, 'error:', error)
      } else {
        // Fallback: find profile by stripe_customer_id already stored on checkout
        const { data: profileByCustomer } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', session.customer as string)
          .single()

        if (profileByCustomer) {
          const { error } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', profileByCustomer.id)

          console.log('Updated profile by stripe_customer_id fallback, error:', error)
        } else {
          console.warn('Could not find profile for customer:', session.customer)
        }
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()
    if (profile) {
      await supabase.from('profiles').update({
        subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
        subscription_period_end: periodEnd(subscription),
      }).eq('id', profile.id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()
    if (profile) {
      await supabase.from('profiles').update({
        subscription_status: 'inactive',
        stripe_subscription_id: null,
      }).eq('id', profile.id)
    }
  }

  return NextResponse.json({ received: true })
}
