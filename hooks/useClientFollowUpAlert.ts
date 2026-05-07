import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AI_MODELS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';
import type { Lead } from '../types';

const FOLLOWUP_THRESHOLD_DAYS = 7;

export type ClientAlert = {
  urgency: 'alta' | 'media' | 'baixa';
  suggestion: string;
};

export function useClientFollowUpAlert(client: Lead) {
  const [loading, setLoading] = useState(false);
  const clientAlerts = useAppStore((s) => s.clientAlerts);
  const setClientAlert = useAppStore((s) => s.setClientAlert);

  const cached = clientAlerts[client.id];

  const daysWithoutFollowUp = client.followUpDate
    ? Math.floor((Date.now() - new Date(client.followUpDate + 'T00:00:00').getTime()) / 86_400_000)
    : null;

  const needsAlert = daysWithoutFollowUp === null || daysWithoutFollowUp >= FOLLOWUP_THRESHOLD_DAYS;

  const analyze = async () => {
    if (cached || loading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Chave de API Gemini não configurada.');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const daysLabel = daysWithoutFollowUp !== null
        ? `${daysWithoutFollowUp} dias`
        : 'nunca registrado';

      const prompt = `Você é um assistente de vendas consultivo. Analise este cliente e gere uma mensagem de follow-up para WhatsApp.

Cliente:
- Nome: ${client.name}
- Produto: ${client.product}
- Módulo atual: ${client.module ?? 'não informado'}
- Dias sem follow-up: ${daysLabel}
- Status de pagamento: ${client.paymentStatus ?? 'Em dia'}

Retorne SOMENTE um JSON válido, sem markdown, sem explicação:
{"urgency": "<alta|media|baixa>", "suggestion": "<mensagem WhatsApp em 2-3 frases, tom consultivo e empático, primeira pessoa>"}`;

      const response = await ai.models.generateContent({
        model: AI_MODELS.FLASH,
        contents: prompt,
      });

      const text = response.text ?? '';
      const parsed = JSON.parse(text.trim());

      if (
        ['alta', 'media', 'baixa'].includes(parsed.urgency) &&
        typeof parsed.suggestion === 'string'
      ) {
        setClientAlert(client.id, {
          urgency: parsed.urgency as 'alta' | 'media' | 'baixa',
          suggestion: parsed.suggestion,
        });
      }
    } catch {
      toast.error('Não foi possível gerar a sugestão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    daysWithoutFollowUp,
    needsAlert,
    alert: cached ?? null,
    loading,
    analyze,
  };
}
