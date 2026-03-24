export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
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
    const userId = session.metadata?.supabase_user_id
    if (userId && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const sub = subscription as unknown as { id: string; current_period_end: number }
      await supabase.from('profiles').update({
        stripe_subscription_id: sub.id,
        subscription_status: 'active',
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const sub = subscription as unknown as { id: string; status: string; current_period_end: number }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', sub.id)
      .single()
    if (profile) {
      await supabase.from('profiles').update({
        subscription_status: sub.status === 'active' ? 'active' : 'inactive',
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', profile.id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const sub = subscription as unknown as { id: string }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', sub.id)
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

export const config = { api: { bodyParser: false } }
