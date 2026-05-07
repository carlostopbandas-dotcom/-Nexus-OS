import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FB_ACCESS_TOKEN = Deno.env.get('FB_ACCESS_TOKEN_VCCHIC_BM')
const FB_AD_ACCOUNT_ID = Deno.env.get('FB_AD_ACCOUNT_ID_VCCHIC')
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FBCampaignInsight {
  campaign_id: string
  campaign_name: string
  spend: string
  impressions: string
  clicks: string
  date_start: string
  date_stop: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const cronSecret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({ error: 'Facebook Ads não configurado — verifique FB_ACCESS_TOKEN_VCCHIC_BM e FB_AD_ACCOUNT_ID_VCCHIC' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const params = new URLSearchParams({
      fields: 'campaign_id,campaign_name,spend,impressions,clicks',
      date_preset: 'last_30d',
      level: 'campaign',
      access_token: FB_ACCESS_TOKEN,
    })

    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${FB_AD_ACCOUNT_ID}/insights?${params}`
    )

    if (!fbResponse.ok) {
      const errorText = await fbResponse.text()
      await supabase.from('ads_sync_log').insert({
        source: 'facebook',
        store_name: 'vcchic',
        status: 'error',
        records: 0,
        error_msg: `Facebook API ${fbResponse.status}: ${errorText.slice(0, 500)}`,
      })
      return new Response(JSON.stringify({ error: 'Facebook API error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fbData = await fbResponse.json()
    const campaigns: FBCampaignInsight[] = fbData.data ?? []

    if (campaigns.length > 0) {
      const { error: upsertError } = await supabase
        .from('ads_campaigns_cache')
        .upsert(
          campaigns.map(c => ({
            source: 'facebook',
            store_name: 'vcchic',
            campaign_id: c.campaign_id,
            campaign_name: c.campaign_name,
            spend: parseFloat(c.spend ?? '0'),
            impressions: parseInt(c.impressions ?? '0'),
            clicks: parseInt(c.clicks ?? '0'),
            date_start: c.date_start,
            date_end: c.date_stop,
            fetched_at: new Date().toISOString(),
          })),
          { onConflict: 'source,campaign_id,date_start,date_end' }
        )

      if (upsertError) {
        await supabase.from('ads_sync_log').insert({
          source: 'facebook',
          store_name: 'vcchic',
          status: 'error',
          records: 0,
          error_msg: upsertError.message,
        })
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    await supabase.from('ads_sync_log').insert({
      source: 'facebook',
      store_name: 'vcchic',
      status: 'success',
      records: campaigns.length,
    })

    return new Response(JSON.stringify({ ok: true, synced: campaigns.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await supabase.from('ads_sync_log').insert({
      source: 'facebook',
      store_name: 'vcchic',
      status: 'error',
      records: 0,
      error_msg: message,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
