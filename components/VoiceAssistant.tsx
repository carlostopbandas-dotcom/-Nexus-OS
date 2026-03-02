
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Zap, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { CallLog } from '../types';
import { AI_MODELS } from '../constants';
import { supabase } from '../lib/supabase';

interface VoiceAssistantProps {
  onAddCallLog: (log: CallLog) => void;
  setActiveTab: (tab: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onAddCallLog, setActiveTab }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const sessionRef = useRef<Promise<any> | null>(null);

  // Audio Processing Helpers
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // =============================================
  // TOOL DECLARATIONS (9 total)
  // =============================================

  const logCallTool: FunctionDeclaration = {
    name: 'log_sales_call',
    description: 'Registra uma nova call de vendas, mentoria ou análise de diagnóstico no sistema Smart Calls.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        leadName: { type: Type.STRING, description: 'Nome do lead ou cliente.' },
        summary: { type: Type.STRING, description: 'Resumo do que foi conversado na call. Identifique se é perfil "Resgate Financeiro" ou "Transição de Carreira".' },
        sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'], description: 'Sentimento geral da call.' },
        type: { type: Type.STRING, enum: ['Discovery', 'Closing', 'Mentorship', 'Mapa da Clareza'], description: 'Tipo da reunião. Use "Mapa da Clareza" para sessões pagas de diagnóstico.' }
      },
      required: ['leadName', 'summary', 'sentiment']
    }
  };

  const navigateToPageTool: FunctionDeclaration = {
    name: 'navigate_to_page',
    description: 'Navega para uma aba/página específica do Nexus OS. Use quando o Carlos pedir para abrir, ir, navegar ou mostrar uma seção.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: {
          type: Type.STRING,
          enum: ['dashboard', 'okrs', 'pipeline', 'content', 'knowledge', 'calls', 'routine', 'tasks', 'ai', 'vcchic', 'sezo', 'shopify'],
          description: 'Página destino. Mapeamentos: "CRM" ou "leads" = pipeline, "agenda" ou "calendário" = routine, "sprint" = tasks, "conteúdo" = content, "base de conhecimento" = knowledge, "conselheiro" ou "advisor" = ai. Lojas: "VcChic" ou "loja vcchic" = vcchic, "Sezo" ou "loja sezo" = sezo, "Moriel" ou "loja moriel" = shopify.'
        }
      },
      required: ['page']
    }
  };

  const addTaskTool: FunctionDeclaration = {
    name: 'add_task',
    description: 'Cria uma nova tarefa no sistema Sprint 1-3-5 do Nexus OS.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Título da tarefa.' },
        type: { type: Type.STRING, enum: ['Big Rock', 'Medium', 'Small'], description: 'Tipo da tarefa: "Big Rock" para grandes (1), "Medium" para médias (3), "Small" para pequenas (5).' },
        category: { type: Type.STRING, enum: ['VcChic', 'Formação 3D', 'Personal', 'Marketing', 'Operations'], description: 'Categoria da tarefa. Se não especificado, usar "Personal".' }
      },
      required: ['title', 'type']
    }
  };

  const completeTaskTool: FunctionDeclaration = {
    name: 'complete_task',
    description: 'Marca uma tarefa existente como concluída. Busca pelo título mais parecido.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING, description: 'Título ou parte do título da tarefa a ser completada.' }
      },
      required: ['taskTitle']
    }
  };

  const addLeadTool: FunctionDeclaration = {
    name: 'add_lead',
    description: 'Adiciona um novo lead ao pipeline do CRM.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Nome do lead.' },
        product: { type: Type.STRING, enum: ['Mapa da Clareza', 'Formação 3D', 'Projeto Respirar', 'Mentoria'], description: 'Produto de interesse do lead.' },
        value: { type: Type.NUMBER, description: 'Valor estimado do deal em reais.' },
        source: { type: Type.STRING, enum: ['Instagram', 'Indicação', 'WhatsApp', 'Orgânico', 'Anúncio'], description: 'Origem do lead. Se não informado, usar "Orgânico".' }
      },
      required: ['name', 'product', 'value']
    }
  };

  const scheduleEventTool: FunctionDeclaration = {
    name: 'schedule_event',
    description: 'Agenda um evento (call, reunião, sessão) no calendário do Nexus.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Título do evento. Ex: "Call com Ana".' },
        date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD. Use "hoje", "amanhã" etc para calcular.' },
        time: { type: Type.STRING, description: 'Horário no formato HH:MM. Ex: "14:00".' },
        type: { type: Type.STRING, enum: ['call', 'meeting', 'session', 'personal'], description: 'Tipo do evento.' }
      },
      required: ['title', 'date', 'time']
    }
  };

  const editEventTool: FunctionDeclaration = {
    name: 'edit_event',
    description: 'Edita um evento já existente no calendário. Busca pelo título e altera horário, data e/ou tipo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        eventTitle: { type: Type.STRING, description: 'Título ou parte do título do evento a ser editado.' },
        newTime: { type: Type.STRING, description: 'Novo horário no formato HH:MM. Omitir se não mudar.' },
        newDate: { type: Type.STRING, description: 'Nova data no formato YYYY-MM-DD. Omitir se não mudar.' },
        newTitle: { type: Type.STRING, description: 'Novo título para o evento. Omitir se não mudar.' },
        newType: { type: Type.STRING, enum: ['call', 'meeting', 'session', 'personal'], description: 'Novo tipo do evento. Omitir se não mudar.' }
      },
      required: ['eventTitle']
    }
  };

  const getDailyBriefingTool: FunctionDeclaration = {
    name: 'get_daily_briefing',
    description: 'Gera um briefing/resumo executivo do dia com tarefas pendentes, eventos agendados, leads ativos e métricas recentes.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  };

  const saveStoreMetricTool: FunctionDeclaration = {
    name: 'save_store_metric',
    description: 'Registra métrica de vendas e gasto de uma loja (VcChic, Formação 3D, etc).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        store_name: { type: Type.STRING, description: 'Nome da loja. Ex: "VcChic", "Formação 3D".' },
        sales: { type: Type.NUMBER, description: 'Valor de faturamento/vendas em reais.' },
        spend: { type: Type.NUMBER, description: 'Valor de gasto/investimento em anúncios em reais.' }
      },
      required: ['store_name', 'sales', 'spend']
    }
  };

  const analyzeCeoCockpitTool: FunctionDeclaration = {
    name: 'analyze_ceo_cockpit',
    description: 'Faz uma análise estratégica completa do Cockpit CEO com métricas MTD de todas as lojas, pipeline de vendas, funil 3D Digital, ROAS por loja e status operacional.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  };

  const getLocalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getLocalTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const connectToGemini = async () => {
    if (!process.env.GEMINI_API_KEY) {
        alert("API Key necessária para o Nexus Voice.");
        return;
    }

    setIsConnecting(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Setup Audio Contexts
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        // Get Mic Stream
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });

        // Create a separate context for input processing to ensure correct sample rate for API
        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputSourceRef.current = inputContext.createMediaStreamSource(streamRef.current);
        processorRef.current = inputContext.createScriptProcessor(4096, 1, 1);

        // Connect Session
        const sessionPromise = ai.live.connect({
            model: AI_MODELS.VOICE,
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                tools: [{ functionDeclarations: [
                  logCallTool,
                  navigateToPageTool,
                  addTaskTool,
                  completeTaskTool,
                  addLeadTool,
                  scheduleEventTool,
                  editEventTool,
                  getDailyBriefingTool,
                  saveStoreMetricTool,
                  analyzeCeoCockpitTool
                ] }],
                systemInstruction: `Você é o Nexus Voice, assistente executivo de comando de voz do Carlos no Nexus OS.

DATA E HORA ATUAL (horário de Brasília, UTC-3): ${getLocalDateStr()} às ${getLocalTimeStr()}. Use sempre esta referência para calcular "hoje", "amanhã", "agora", horários relativos, etc. NUNCA use UTC.

Você controla TODO o sistema por voz. Suas 9 capacidades são:

1. **log_sales_call** — Registrar calls de vendas/mentoria/Mapa da Clareza. Perfis: "Resgate" (endividado → Projeto Respirar) ou "Transição" (estável → Formação 3D).
2. **navigate_to_page** — Navegar entre as páginas: dashboard, okrs, pipeline (=CRM/leads), content (=conteúdo), knowledge (=base), calls, routine (=agenda/calendário), tasks (=sprint), ai (=conselheiro/advisor). Lojas do Grupo VcChic: vcchic (=VcChic Store), sezo (=Sezo Store), shopify (=Moriel Store).
3. **add_task** — Criar tarefa no Sprint 1-3-5. Classificar como Big Rock (grande), Medium (média), Small Quick Win (pequena). Categorias: VcChic, Formação 3D, Personal, Marketing, Operations.
4. **complete_task** — Marcar tarefa como concluída buscando pelo título.
5. **add_lead** — Adicionar lead ao CRM com nome, produto, valor e fonte.
6. **schedule_event** — Agendar call/reunião/sessão no calendário. Calcular a data correta (hoje, amanhã, etc).
6b. **edit_event** — Editar evento já existente: alterar horário, data, título ou tipo. Busca pelo título.
7. **get_daily_briefing** — Gerar resumo executivo rápido do dia (contagens de tarefas, eventos, leads novos).
8. **save_store_metric** — Registrar faturamento e gasto de loja, calculando ROAS automaticamente.
9. **analyze_ceo_cockpit** — Análise estratégica COMPLETA do Cockpit CEO: faturamento MTD por loja, ROAS por loja, pipeline de vendas 3D Digital, funil de conversão, breakdown de tarefas por tipo, agenda detalhada do dia e sentimento das calls do mês.

REGRAS:
- Sempre fale português do Brasil, de forma direta e executiva.
- Quando o Carlos pedir para "abrir", "ir para", "mostrar" uma seção → use navigate_to_page.
- Quando mencionar criar/adicionar tarefa → use add_task.
- Quando disser "completa", "marca como feita", "finaliza" tarefa → use complete_task.
- Quando mencionar "novo lead", "adiciona lead" → use add_lead.
- Quando pedir para "agendar", "marcar" call/reunião → use schedule_event.
- Quando pedir para "mudar", "alterar", "reagendar", "editar", "atualizar" horário/data de evento → use edit_event.
- Quando pedir "briefing", "resumo do dia" → use get_daily_briefing (resumo rápido).
- Quando informar faturamento/vendas/gasto de loja → use save_store_metric.
- Quando pedir "cockpit", "análise geral", "como tá o negócio", "dashboard executivo", "analisa o cockpit" → use analyze_ceo_cockpit (análise profunda).
- Após cada ação, confirme brevemente o que foi feito. Na análise do cockpit, narre os dados de forma estruturada e estratégica.`,
            },
            callbacks: {
                onopen: () => {
                    console.log("Nexus Voice Connected");
                    setIsConnecting(false);
                    setIsActive(true);
                    setAssistantStatus('listening');

                    // Start Audio Loop
                    if (inputSourceRef.current && processorRef.current) {
                        inputSourceRef.current.connect(processorRef.current);
                        processorRef.current.connect(inputContext.destination);
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Audio Response
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        setAssistantStatus('speaking');
                        const audioBytes = base64ToUint8Array(audioData);

                        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                            const pcmData = new Int16Array(audioBytes.buffer);
                            const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
                            const channelData = audioBuffer.getChannelData(0);

                            for (let i = 0; i < pcmData.length; i++) {
                                channelData[i] = pcmData[i] / 32768.0;
                            }

                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContextRef.current.destination);

                            const currentTime = audioContextRef.current.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            source.start(startTime);

                            nextStartTimeRef.current = startTime + audioBuffer.duration;
                            audioQueueRef.current.push(source);

                            source.onended = () => {
                                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                                    setAssistantStatus('listening');
                                }
                            };
                        }
                    }

                    // Handle Tool Calls
                    if (message.toolCall) {
                        setAssistantStatus('processing');
                        for (const fc of message.toolCall.functionCalls) {
                            const args = fc.args as any;
                            let responseResult: any = { result: "OK" };

                            try {
                                // ─── log_sales_call ───
                                if (fc.name === 'log_sales_call') {
                                    const newLog: CallLog = {
                                        id: Date.now().toString(),
                                        leadName: args.leadName,
                                        date: 'Agora (Via Voz)',
                                        duration: 'N/A',
                                        type: args.type || 'Discovery',
                                        status: 'Completed',
                                        sentiment: args.sentiment,
                                        transcriptSnippet: `[Registro de Voz Nexus]\nResumo: ${args.summary}`,
                                        summary: args.summary
                                    };
                                    onAddCallLog(newLog);
                                    responseResult = { result: `Call com ${args.leadName} registrada com sucesso.` };
                                }

                                // ─── navigate_to_page ───
                                else if (fc.name === 'navigate_to_page') {
                                    setActiveTab(args.page);
                                    const pageNames: Record<string, string> = {
                                      dashboard: 'Dashboard', okrs: 'OKRs', pipeline: 'Pipeline CRM',
                                      content: 'Content Machine', knowledge: 'Base de Conhecimento',
                                      calls: 'Smart Calls', routine: 'Agenda', tasks: 'Sprint 1-3-5', ai: 'AI Advisor',
                                      vcchic: 'VcChic Store', sezo: 'Sezo Store', shopify: 'Moriel Store'
                                    };
                                    responseResult = { result: `Navegado para ${pageNames[args.page] || args.page}.` };
                                }

                                // ─── add_task ───
                                else if (fc.name === 'add_task') {
                                    const { error } = await supabase.from('tasks').insert({
                                        title: args.title,
                                        type: args.type,
                                        completed: false,
                                        category: args.category || 'Personal'
                                    });
                                    if (error) throw error;
                                    window.dispatchEvent(new CustomEvent('nexus-data-updated'));
                                    responseResult = { result: `Tarefa "${args.title}" criada como ${args.type}.` };
                                }

                                // ─── complete_task ───
                                else if (fc.name === 'complete_task') {
                                    const searchTerm = args.taskTitle.toLowerCase();
                                    const { data: allTasks } = await supabase
                                        .from('tasks')
                                        .select('*')
                                        .eq('completed', false);

                                    if (!allTasks || allTasks.length === 0) {
                                        responseResult = { result: "Nenhuma tarefa pendente encontrada." };
                                    } else {
                                        // Fuzzy match: find best match by inclusion
                                        const match = allTasks.find(t => t.title.toLowerCase().includes(searchTerm))
                                          || allTasks.find(t => searchTerm.includes(t.title.toLowerCase()))
                                          || allTasks.reduce((best, t) => {
                                              const words = searchTerm.split(' ');
                                              const score = words.filter(w => t.title.toLowerCase().includes(w)).length;
                                              const bestWords = searchTerm.split(' ');
                                              const bestScore = bestWords.filter(w => best.title.toLowerCase().includes(w)).length;
                                              return score > bestScore ? t : best;
                                          }, allTasks[0]);

                                        const { error } = await supabase
                                            .from('tasks')
                                            .update({ completed: true })
                                            .eq('id', match.id);
                                        if (error) throw error;
                                        window.dispatchEvent(new CustomEvent('nexus-data-updated'));
                                        responseResult = { result: `Tarefa "${match.title}" marcada como concluída.` };
                                    }
                                }

                                // ─── add_lead ───
                                else if (fc.name === 'add_lead') {
                                    const { error } = await supabase.from('leads').insert({
                                        name: args.name,
                                        email: '',
                                        product: args.product,
                                        source: args.source || 'Orgânico',
                                        value: args.value,
                                        status: 'Novo',
                                        created_at: new Date().toISOString()
                                    });
                                    if (error) throw error;
                                    window.dispatchEvent(new CustomEvent('nexus-data-updated'));
                                    responseResult = { result: `Lead ${args.name} adicionado ao pipeline. Produto: ${args.product}, Valor: R$${args.value}.` };
                                }

                                // ─── schedule_event ───
                                else if (fc.name === 'schedule_event') {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const targetDate = new Date(args.date + 'T00:00:00');
                                    const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                                    const { error } = await supabase.from('events').insert({
                                        title: args.title,
                                        start_time: args.time,
                                        end_time: args.time.replace(/:\d{2}$/, ':00').replace(/^(\d{2})/, (h: string) => String(Math.min(23, parseInt(h) + 1)).padStart(2, '0')),
                                        type: args.type || 'call',
                                        attendees: [],
                                        day_offset: dayOffset
                                    });
                                    if (error) throw error;
                                    window.dispatchEvent(new CustomEvent('nexus-data-updated'));
                                    responseResult = { result: `Evento "${args.title}" agendado para ${args.date} às ${args.time}.` };
                                }

                                // ─── edit_event ───
                                else if (fc.name === 'edit_event') {
                                    const searchTerm = args.eventTitle.toLowerCase();
                                    const { data: allEvents } = await supabase.from('events').select('*');

                                    if (!allEvents || allEvents.length === 0) {
                                        responseResult = { result: "Nenhum evento encontrado no calendário." };
                                    } else {
                                        const match = allEvents.find((e: any) => e.title.toLowerCase().includes(searchTerm))
                                          || allEvents.find((e: any) => searchTerm.includes(e.title.toLowerCase()))
                                          || allEvents.reduce((best: any, e: any) => {
                                              const words = searchTerm.split(' ');
                                              const score = words.filter((w: string) => e.title.toLowerCase().includes(w)).length;
                                              const bestScore = words.filter((w: string) => best.title.toLowerCase().includes(w)).length;
                                              return score > bestScore ? e : best;
                                          }, allEvents[0]);

                                        const updates: Record<string, any> = {};

                                        if (args.newTitle) updates.title = args.newTitle;
                                        if (args.newType) updates.type = args.newType;

                                        if (args.newTime) {
                                            updates.start_time = args.newTime;
                                            updates.end_time = args.newTime.replace(/^(\d{2})/, (h: string) => String(Math.min(23, parseInt(h) + 1)).padStart(2, '0'));
                                        }

                                        if (args.newDate) {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const targetDate = new Date(args.newDate + 'T00:00:00');
                                            updates.day_offset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                                        }

                                        if (Object.keys(updates).length === 0) {
                                            responseResult = { result: "Nenhuma alteração informada para o evento." };
                                        } else {
                                            const { error } = await supabase.from('events').update(updates).eq('id', match.id);
                                            if (error) throw error;
                                            window.dispatchEvent(new CustomEvent('nexus-data-updated'));
                                            const changes = [
                                                args.newTitle ? `título para "${args.newTitle}"` : null,
                                                args.newTime ? `horário para ${args.newTime}` : null,
                                                args.newDate ? `data para ${args.newDate}` : null,
                                                args.newType ? `tipo para ${args.newType}` : null
                                            ].filter(Boolean).join(', ');
                                            responseResult = { result: `Evento "${match.title}" atualizado: ${changes}.` };
                                        }
                                    }
                                }

                                // ─── get_daily_briefing ───
                                else if (fc.name === 'get_daily_briefing') {
                                    const todayStr = getLocalDateStr();

                                    const [tasksRes, eventsRes, leadsRes, metricsRes] = await Promise.all([
                                        supabase.from('tasks').select('*').eq('completed', false),
                                        supabase.from('events').select('*').eq('day_offset', 0),
                                        supabase.from('leads').select('*').eq('status', 'Novo'),
                                        supabase.from('store_metrics').select('*').eq('date', todayStr)
                                    ]);

                                    const pendingTasks = tasksRes.data || [];
                                    const todayEvents = eventsRes.data || [];
                                    const newLeads = leadsRes.data || [];
                                    const todayMetrics = metricsRes.data || [];

                                    const totalSales = todayMetrics.reduce((sum: number, m: any) => sum + (Number(m.sales) || 0), 0);
                                    const totalSpend = todayMetrics.reduce((sum: number, m: any) => sum + (Number(m.spend) || 0), 0);

                                    responseResult = {
                                        result: `Briefing do dia: ${pendingTasks.length} tarefas pendentes, ${todayEvents.length} eventos hoje, ${newLeads.length} leads novos no pipeline. ` +
                                          (todayMetrics.length > 0
                                            ? `Faturamento hoje: R$${totalSales.toFixed(0)}, Gasto: R$${totalSpend.toFixed(0)}, ROAS: ${totalSpend > 0 ? (totalSales / totalSpend).toFixed(1) : 'N/A'}.`
                                            : 'Sem métricas de loja registradas hoje.'),
                                        data: {
                                          pendingTasks: pendingTasks.length,
                                          todayEvents: todayEvents.length,
                                          newLeads: newLeads.length,
                                          totalSales,
                                          totalSpend,
                                          roas: totalSpend > 0 ? totalSales / totalSpend : 0
                                        }
                                    };
                                }

                                // ─── save_store_metric ───
                                else if (fc.name === 'save_store_metric') {
                                    const sales = Number(args.sales);
                                    const spend = Number(args.spend);
                                    const roas = spend > 0 ? sales / spend : 0;
                                    const todayStr = getLocalDateStr();

                                    const { error } = await supabase.from('store_metrics').insert({
                                        store_name: args.store_name,
                                        sales,
                                        spend,
                                        roas,
                                        date: todayStr
                                    });
                                    if (error) throw error;
                                    window.dispatchEvent(new CustomEvent('nexus-data-updated'));
                                    responseResult = { result: `Métrica registrada para ${args.store_name}: Vendas R$${sales}, Gasto R$${spend}, ROAS ${roas.toFixed(1)}x.` };
                                }

                                // ─── analyze_ceo_cockpit ───
                                else if (fc.name === 'analyze_ceo_cockpit') {
                                    const now = new Date();
                                    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                                    const todayStr = getLocalDateStr();

                                    const [metricsRes, leadsRes, tasksRes, eventsRes, callsRes] = await Promise.all([
                                        supabase.from('store_metrics').select('*').gte('date', firstDayOfMonth),
                                        supabase.from('leads').select('*'),
                                        supabase.from('tasks').select('*'),
                                        supabase.from('events').select('*').eq('day_offset', 0),
                                        supabase.from('call_logs').select('*').gte('created_at', firstDayOfMonth)
                                    ]);

                                    const metrics = metricsRes.data || [];
                                    const leads = leadsRes.data || [];
                                    const tasks = tasksRes.data || [];
                                    const todayEvents = eventsRes.data || [];
                                    const monthCalls = callsRes.data || [];

                                    // === MÉTRICAS POR LOJA (MTD) ===
                                    const storeMap: Record<string, { sales: number; spend: number }> = {};
                                    let totalMtdSales = 0;
                                    let totalMtdSpend = 0;
                                    for (const m of metrics) {
                                        const name = m.store_name;
                                        if (!storeMap[name]) storeMap[name] = { sales: 0, spend: 0 };
                                        storeMap[name].sales += Number(m.sales) || 0;
                                        storeMap[name].spend += Number(m.spend) || 0;
                                        totalMtdSales += Number(m.sales) || 0;
                                        totalMtdSpend += Number(m.spend) || 0;
                                    }
                                    const globalRoas = totalMtdSpend > 0 ? totalMtdSales / totalMtdSpend : 0;

                                    const storeBreakdown = Object.entries(storeMap)
                                        .map(([name, d]) => `${name}: Vendas R$${d.sales.toFixed(0)}, Gasto R$${d.spend.toFixed(0)}, ROAS ${d.spend > 0 ? (d.sales / d.spend).toFixed(1) : 'N/A'}x`)
                                        .join('. ');

                                    // === PIPELINE & CONVERSÃO ===
                                    const products3D = ['Nexus', 'Mapa da Clareza', 'Formação 3D'];
                                    const leads3D = leads.filter((l: any) => products3D.includes(l.product));
                                    const leadsWon = leads.filter((l: any) => l.status === 'Vendido');
                                    const leadsWon3D = leads3D.filter((l: any) => l.status === 'Vendido');
                                    const totalPipeline = leads.reduce((s: number, l: any) => s + (Number(l.value) || 0), 0);
                                    const pipeline3D = leads3D.reduce((s: number, l: any) => s + (Number(l.value) || 0), 0);
                                    const revenue3D = leadsWon3D.reduce((s: number, l: any) => s + (Number(l.value) || 0), 0);
                                    const conversionRate = leads.length > 0 ? ((leadsWon.length / leads.length) * 100).toFixed(1) : '0';

                                    // === TAREFAS POR TIPO ===
                                    const pendingTasks = tasks.filter((t: any) => !t.completed);
                                    const bigRocks = pendingTasks.filter((t: any) => t.type === 'Big Rock');
                                    const mediums = pendingTasks.filter((t: any) => t.type === 'Medium');
                                    const smalls = pendingTasks.filter((t: any) => t.type === 'Small Quick Win');
                                    const focoBigRock = bigRocks.length > 0 ? bigRocks[0].title : 'Nenhum Big Rock pendente';

                                    // === EVENTOS HOJE ===
                                    const eventsList = todayEvents
                                        .slice(0, 5)
                                        .map((e: any) => `${e.start_time} - ${e.title}`)
                                        .join(', ');

                                    // === CALLS DO MÊS ===
                                    const positiveCount = monthCalls.filter((c: any) => c.sentiment === 'Positive').length;
                                    const negativeCount = monthCalls.filter((c: any) => c.sentiment === 'Negative').length;

                                    // === MONTAR RESPOSTA NARRATIVA ===
                                    const narrative = [
                                        `COCKPIT CEO — Análise completa.`,
                                        `FINANCEIRO MTD: Faturamento total R$${totalMtdSales.toFixed(0)}, Gasto total R$${totalMtdSpend.toFixed(0)}, ROAS global ${globalRoas.toFixed(1)}x.`,
                                        storeBreakdown ? `POR LOJA: ${storeBreakdown}.` : '',
                                        `PIPELINE: ${leads.length} leads totais, valor R$${totalPipeline.toFixed(0)}. 3D Digital: ${leads3D.length} leads, pipeline R$${pipeline3D.toFixed(0)}, faturamento fechado R$${revenue3D.toFixed(0)}. Taxa de conversão geral: ${conversionRate}%.`,
                                        `OPERACIONAL: ${pendingTasks.length} tarefas pendentes (${bigRocks.length} Big Rock, ${mediums.length} Medium, ${smalls.length} Small). Foco do dia: ${focoBigRock}.`,
                                        todayEvents.length > 0 ? `AGENDA HOJE: ${todayEvents.length} eventos. ${eventsList}.` : 'AGENDA: Nenhum evento hoje.',
                                        monthCalls.length > 0 ? `CALLS DO MÊS: ${monthCalls.length} realizadas, ${positiveCount} positivas, ${negativeCount} negativas.` : ''
                                    ].filter(Boolean).join(' ');

                                    responseResult = { result: narrative };
                                }

                            } catch (err: any) {
                                console.error(`Erro no tool ${fc.name}:`, err);
                                responseResult = { result: `Erro ao executar ${fc.name}: ${err.message || 'erro desconhecido'}.` };
                            }

                            // Send tool response back to Gemini
                            sessionPromise.then(session => {
                                session.sendToolResponse({
                                    functionResponses: {
                                        id: fc.id,
                                        name: fc.name,
                                        response: responseResult
                                    }
                                });
                            });
                        }
                    }
                },
                onclose: () => {
                    console.log("Session closed");
                    disconnect();
                },
                onerror: (err) => {
                    console.error("Session error:", err);
                    disconnect();
                }
            }
        });

        sessionRef.current = sessionPromise;

        // Process Input Audio
        processorRef.current.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);

            // Visualizer logic
            let sum = 0;
            for(let i=0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            const vol = Math.sqrt(sum / inputData.length);
            setVolumeLevel(vol);

            // Send to Gemini
            const pcmData = floatTo16BitPCM(inputData);
            const base64Audio = arrayBufferToBase64(pcmData.buffer);

            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Audio
                    }
                });
            });
        };

    } catch (error) {
        console.error("Connection failed", error);
        setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsActive(false);
    setAssistantStatus('idle');
    setVolumeLevel(0);

    // Cleanup Media Stream
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    // Cleanup Audio Nodes
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }

    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }

    // Safely Close Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
    }
    audioContextRef.current = null;

    // Cleanup Session
    if (sessionRef.current) {
        sessionRef.current.then(session => {
            try {
                session.close();
            } catch (e) {
                console.warn("Error closing session:", e);
            }
        }).catch(() => {});
        sessionRef.current = null;
    }
  };

  // Visualizer Rings
  const getRingScale = (index: number) => {
      if (assistantStatus === 'speaking') return 1 + (Math.sin(Date.now() / 200 + index) * 0.2);
      if (assistantStatus === 'processing') return 1 + (Math.sin(Date.now() / 100 + index) * 0.1);
      return 1 + (volumeLevel * (index + 2) * 2);
  };

  const [visualizerTick, setVisualizerTick] = useState(0);
  useEffect(() => {
      if (!isActive) return;
      const interval = setInterval(() => setVisualizerTick(t => t + 1), 50);
      return () => clearInterval(interval);
  }, [isActive]);


  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">

      {/* Expanded Interface */}
      {isActive && (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl border border-slate-700 w-80 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-blue-400" />
                    <span className="font-bold text-sm tracking-widest uppercase">Nexus Voice</span>
                </div>
                <button onClick={disconnect} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center h-32 relative mb-4">
                {/* Visualizer Orb */}
                <div className="relative flex items-center justify-center">
                    <div
                        className={`absolute w-16 h-16 rounded-full opacity-30 transition-all duration-75 ${assistantStatus === 'speaking' ? 'bg-blue-400' : assistantStatus === 'processing' ? 'bg-purple-500' : 'bg-white'}`}
                        style={{ transform: `scale(${getRingScale(2)})` }}
                    ></div>
                    <div
                        className={`absolute w-16 h-16 rounded-full opacity-50 transition-all duration-75 ${assistantStatus === 'speaking' ? 'bg-blue-600' : assistantStatus === 'processing' ? 'bg-purple-600' : 'bg-slate-200'}`}
                        style={{ transform: `scale(${getRingScale(1)})` }}
                    ></div>
                    <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,85,164,0.5)] transition-colors duration-300 ${assistantStatus === 'speaking' ? 'bg-blue-600' : assistantStatus === 'processing' ? 'bg-purple-600 animate-pulse' : 'bg-white'}`}>
                        {assistantStatus === 'processing' ? (
                            <Loader2 size={24} className="text-white animate-spin" />
                        ) : assistantStatus === 'speaking' ? (
                             <Volume2 size={24} className="text-white" />
                        ) : (
                            <Mic size={24} className="text-slate-900" />
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2">
                <p className="font-medium text-lg">
                    {assistantStatus === 'listening' ? "Estou ouvindo..." :
                     assistantStatus === 'speaking' ? "Nexus falando..." :
                     assistantStatus === 'processing' ? "Processando..." : "Aguardando"}
                </p>
                <p className="text-xs text-slate-400">
                    "Abre o CRM" | "Adiciona tarefa" | "Analisa o cockpit"
                </p>
            </div>
        </div>
      )}

      {/* FAB Trigger */}
      {!isActive && (
          <button
            onClick={connectToGemini}
            disabled={isConnecting}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-110 transition-transform group"
          >
              {isConnecting ? (
                  <Loader2 size={24} className="animate-spin" />
              ) : (
                  <>
                    <Mic size={24} className="group-hover:hidden" />
                    <Zap size={24} className="hidden group-hover:block fill-current" />
                  </>
              )}
          </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
