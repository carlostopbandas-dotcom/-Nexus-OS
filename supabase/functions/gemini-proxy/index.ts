// supabase/functions/gemini-proxy/index.ts
// Proxy para Gemini Live API — gera token efêmero de curta duração
// Story 1.1.2 — Sprint 1
//
// Fluxo: VoiceAssistant.tsx → POST /gemini-proxy → retorna ephemeral_token
// Frontend usa o token efêmero para conectar diretamente ao Gemini via WebSocket
// O token expira em ~1 minuto — a API key permanente nunca chega ao browser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_EPHEMERAL_TOKEN_URL = 'https://generativelanguage.googleapis.com/v1beta/sessions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validar autenticação Supabase
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Solicitar token efêmero à API Gemini
  // Ephemeral tokens têm duração de ~1 minuto — seguros para expor ao frontend
  const body = await req.json().catch(() => ({}))
  const model = body.model ?? 'gemini-2.5-flash-native-audio-preview-12-2025'

  const tokenResponse = await fetch(`${GEMINI_EPHEMERAL_TOKEN_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      config: body.config ?? {},
      ttlSeconds: 60,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error('Gemini token error:', errorText)
    return new Response(JSON.stringify({ error: 'Failed to generate ephemeral token' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const tokenData = await tokenResponse.json()

  return new Response(JSON.stringify({ ephemeralToken: tokenData.name ?? tokenData }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
