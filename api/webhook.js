import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import {
  errorResponse,
  getRequestId,
  isWebhookProcessed,
  markWebhookProcessed,
  rateLimit,
  requireEnv,
} from './_lib/security.js'

const envCheck = requireEnv(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
const stripe = envCheck.ok ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const supabase = envCheck.ok
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
export default async function handler(req, res) {
  const requestId = getRequestId(req, res)
  if (req.method !== 'POST') return errorResponse(res, 405, 'Method not allowed', requestId)
  if (!envCheck.ok || !stripe || !supabase) return errorResponse(res, 500, envCheck.error, requestId)

  const rl = rateLimit(req, 'stripe-webhook', 300, 60_000)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec))
    return errorResponse(res, 429, 'Too many webhook requests', requestId)
  }

  const sig = req.headers['stripe-signature']
  if (!sig) return errorResponse(res, 400, 'Missing Stripe signature', requestId)

  let event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return errorResponse(res, 400, err.message || 'Invalid webhook signature', requestId)
  }

  if (await isWebhookProcessed(supabase, event.id)) {
    return res.status(200).json({ received: true, duplicate: true, requestId })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object, meta = s.metadata || {}
    const { type, playerId, playerName, shareTier, buyerName, buyerEmail, playerRank, season } = meta
    const amount = s.amount_total / 100
    await supabase.from('payments').insert({ id: crypto.randomUUID(), description: type === 'share' ? `Share (${shareTier}) on ${playerName}` : type === 'registration' ? `Registration — ${playerName}` : `Weekly Dues — ${playerName}`, amount, type: type || 'other', date: new Date().toISOString().split('T')[0], source: 'stripe', stripe_session_id: s.id, stripe_payment_intent: s.payment_intent, metadata: meta })
    if (type === 'share' && playerId && shareTier)
      await supabase.from('shares').insert({ id: crypto.randomUUID(), buyer_name: buyerName || s.customer_email || 'Unknown', buyer_email: buyerEmail || s.customer_email || '', player_id: playerId, tier: shareTier, season: Number(season) || 1, price: amount, status: 'active', manual_entry: false, stripe_session_id: s.id, stripe_payment_intent: s.payment_intent })
    if (type === 'registration' && playerId)
      await supabase.from('players').update({ registration_paid: true }).eq('id', playerId)
    if (type === 'weekly_dues' && playerId) {
      const { data: p } = await supabase.from('players').select('weekly_dues_paid').eq('id', playerId).single()
      if (p) await supabase.from('players').update({ weekly_dues_paid: [...(p.weekly_dues_paid || []), (p.weekly_dues_paid || []).length + 1] }).eq('id', playerId)
    }
  }

  if (event.type === 'refund.created') {
    const r = event.data.object
    await supabase.from('payments').insert({ id: crypto.randomUUID(), description: `Refund — ${r.id}`, amount: r.amount / 100, type: 'refund', date: new Date().toISOString().split('T')[0], source: 'stripe', stripe_payment_intent: r.payment_intent, metadata: { refundId: r.id } })
    await supabase.from('shares').update({ status: 'refunded' }).eq('stripe_payment_intent', r.payment_intent)
  }

  await markWebhookProcessed(supabase, event.id, event.type)
  return res.status(200).json({ received: true, requestId })
}
