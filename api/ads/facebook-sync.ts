import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Chamador 1: Vercel Cron — autenticado por x-vercel-cron ou x-cron-secret
  const isCron =
    req.headers['x-vercel-cron'] === '1' ||
    req.headers['x-cron-secret'] === process.env.CRON_SECRET

  if (!isCron) {
    // Chamador 2: Frontend — valida JWT Supabase do usuário logado
    const authHeader = req.headers.authorization as string | undefined
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const cronSecret = process.env.CRON_SECRET

  if (!supabaseUrl || !cronSecret) {
    return res.status(503).json({ error: 'SUPABASE_URL ou CRON_SECRET não configurados' })
  }

  try {
    const edgeFnUrl = `${supabaseUrl}/functions/v1/ads-facebook-sync`
    const response = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: { 'x-cron-secret': cronSecret },
    })
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
