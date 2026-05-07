import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const GOOGLE_REFRESH_TOKEN_CEO = Deno.env.get('GOOGLE_REFRESH_TOKEN_CEO')
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: GOOGLE_REFRESH_TOKEN_CEO!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Falha ao obter access_token do Google')
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Auth: CRON_SECRET header OU Bearer token de sessão CEO
  const cronSecret = req.headers.get('x-cron-secret')
  const authHeader = req.headers.get('authorization') ?? ''
  const isFromCron = CRON_SECRET && cronSecret === CRON_SECRET
  const isFromSession = authHeader.startsWith('Bearer ')

  if (!isFromCron && !isFromSession) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Guard: secrets Google não configurados
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN_CEO) {
    return json(
      { error: 'Google Calendar não configurado — configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REFRESH_TOKEN_CEO no Supabase' },
      503
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let imported = 0
  let exported = 0

  try {
    const accessToken = await getAccessToken()

    // ── Import: Google → Nexus ──────────────────────────────────────────────
    const now = new Date().toISOString()
    const timeMax = new Date(Date.now() + 90 * 86400000).toISOString()

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${timeMax}&maxResults=250&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const calData = await calRes.json()

    if (calData.items?.length) {
      const eventsToUpsert = calData.items.map((e: Record<string, unknown>) => {
        const start = e.start as Record<string, string>
        const end = e.end as Record<string, string> | undefined
        return {
          title: (e.summary as string) ?? '(sem título)',
          start_time: start.dateTime ?? start.date,
          end_time: end?.dateTime ?? end?.date ?? null,
          google_event_id: e.id as string,
          type: 'meeting',
        }
      })

      const { error: upsertError } = await supabase
        .from('events')
        .upsert(eventsToUpsert, { onConflict: 'google_event_id' })

      if (upsertError) throw new Error(`Erro no upsert: ${upsertError.message}`)
      imported = eventsToUpsert.length
    }

    // ── Export: Nexus → Google ──────────────────────────────────────────────
    const { data: localEvents, error: localErr } = await supabase
      .from('events')
      .select('id, title, start_time, end_time')
      .is('google_event_id', null)
      .gte('start_time', now)

    if (localErr) throw new Error(`Erro ao ler eventos locais: ${localErr.message}`)

    for (const event of localEvents ?? []) {
      const createRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.title,
            start: { dateTime: event.start_time, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: event.end_time ?? event.start_time, timeZone: 'America/Sao_Paulo' },
          }),
        }
      )
      const created = await createRes.json()
      if (created.id) {
        await supabase
          .from('events')
          .update({ google_event_id: created.id })
          .eq('id', event.id)
        exported++
      }
    }

    // ── Log ─────────────────────────────────────────────────────────────────
    await supabase.from('calendar_sync_log').insert({
      status: 'success',
      imported,
      exported,
    })

    return json({ imported, exported, synced_at: new Date().toISOString() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'

    await supabase.from('calendar_sync_log').insert({
      status: 'error',
      imported,
      exported,
      error_msg: message,
    })

    return json({ error: message }, 500)
  }
})
