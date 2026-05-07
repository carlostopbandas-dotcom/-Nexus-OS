import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AI_MODELS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';
import type { Lead } from '../types';

export type PipelineSummaryData = {
  opportunities: string[];
  risks: string[];
  focus: string;
};

export function usePipelineSummary(leads: Lead[]) {
  const [loading, setLoading] = useState(false);
  const pipelineSummary = useAppStore((s) => s.pipelineSummary);
  const setPipelineSummary = useAppStore((s) => s.setPipelineSummary);
  const clearPipelineSummary = useAppStore((s) => s.clearPipelineSummary);

  const generate = async () => {
    const currentSummary = useAppStore.getState().pipelineSummary;
    if (loading || currentSummary) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Chave de API Gemini não configurada.');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const byStatus = leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const top5 = [...leads]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(l => `${l.name} (${l.status}, R$${l.value}, ${l.businessUnit ?? ''})`);

      const semAcao = leads.filter(l => !l.nextAction).map(l => l.name);

      const prompt = `Analise o pipeline de vendas abaixo e retorne SOMENTE um JSON válido, sem markdown, sem explicação:

Pipeline:
- Total de leads: ${leads.length}
- Por status: ${JSON.stringify(byStatus)}
- Top 5 por valor: ${top5.join(' | ')}
- Leads sem próxima ação: ${semAcao.length > 0 ? semAcao.join(', ') : 'nenhum'}

Retorne:
{"opportunities": ["<oportunidade 1>", "<oportunidade 2>", "<oportunidade 3>"], "risks": ["<risco 1>", "<risco 2>"], "focus": "<recomendação de foco para o CEO em 1 frase>"}`;

      const response = await ai.models.generateContent({
        model: AI_MODELS.FLASH,
        contents: prompt,
      });

      const text = response.text ?? '';
      const parsed = JSON.parse(text.trim());

      if (
        Array.isArray(parsed.opportunities) &&
        Array.isArray(parsed.risks) &&
        typeof parsed.focus === 'string'
      ) {
        setPipelineSummary({
          opportunities: parsed.opportunities,
          risks: parsed.risks,
          focus: parsed.focus,
        });
      }
    } catch {
      toast.error('Não foi possível gerar o resumo do pipeline. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (loading) return;
    clearPipelineSummary();
    await generate();
  };

  return {
    summary: pipelineSummary,
    loading,
    generate,
    refresh,
  };
}
