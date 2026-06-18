import { createClient } from '@supabase/supabase-js'

const hasDb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = hasDb ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!supabase) return res.status(200).json({ dashboard: null, note: 'Supabase not configured' })

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('settings, updated_at')
      .eq('id', 1)
      .single()

    if (error) throw error

    return res.status(200).json({
      dashboard: data?.settings?.dashboard || null,
      updatedAt: data?.updated_at || null,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
