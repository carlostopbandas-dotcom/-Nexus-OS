import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AI_MODELS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';
import type { Lead } from '../types';

export function useLeadAIScore(lead: Lead) {
  const [loading, setLoading] = useState(false);
  const aiScores = useAppStore((s) => s.aiScores);
  const setLeadAIScore = useAppStore((s) => s.setLeadAIScore);

  const cached = aiScores[lead.id];

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
      const createdAt = lead.createdAt ? new Date(lead.createdAt) : new Date();
      const days = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);

      const prompt = `Analise este lead de vendas e retorne SOMENTE um JSON válido, sem markdown, sem explicação:

Lead:
- Nome: ${lead.name}
- Produto: ${lead.product}
- Business Unit: ${lead.businessUnit ?? ''}
- Status atual: ${lead.status}
- Valor: R$ ${lead.value}
- Dias no pipeline: ${days}
- Dor principal: ${lead.painPoint ?? 'não informado'}
- Próxima ação registrada: ${lead.nextAction ?? 'nenhuma'}

Retorne:
{"score": <número de 0 a 100 indicando urgência/prioridade>, "suggestion": "<ação recomendada em 1 frase curta>"}`;

      const response = await ai.models.generateContent({
        model: AI_MODELS.FLASH,
        contents: prompt,
      });

      const text = response.text ?? '';
      const parsed = JSON.parse(text.trim());

      if (typeof parsed.score === 'number' && typeof parsed.suggestion === 'string') {
        setLeadAIScore(lead.id, { score: parsed.score, suggestion: parsed.suggestion });
      }
    } catch {
      toast.error('Não foi possível analisar o lead com IA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    score: cached?.score ?? null,
    suggestion: cached?.suggestion ?? null,
    loading,
    analyze,
  };
}
