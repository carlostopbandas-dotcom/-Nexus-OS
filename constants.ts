
import { Lead, LeadStatus, OKR, ScheduleBlock, Task, CalendarEvent, CallLog } from './types';

// AI Model Constants
export const AI_MODELS = {
  FLASH: 'gemini-2.5-flash',
  VOICE: 'gemini-2.5-flash-native-audio-preview-12-2025',
} as const;

// Based on "3) OKRs 2026"
export const INITIAL_OKRS: OKR[] = [
  {
    id: 'o1',
    unit: '3D Digital',
    objective: 'Validar Oferta e Funil',
    progress: 45,
    keyResults: [
      { text: '500 respostas no Mapa da Clareza (Diagnóstico)', completed: false },
      { text: '100 vendas somadas (Mapa/Nexus)', completed: false },
      { text: 'NPS > 60', completed: true },
      { text: 'Taxa de conclusão > 70%', completed: true }
    ]
  },
  {
    id: 'o2',
    unit: '3D Digital',
    objective: 'Construir Audiência',
    progress: 20,
    keyResults: [
      { text: '25k seguidores somados', completed: false },
      { text: '5k leads', completed: false },
      { text: '30% abertura e-mail', completed: true }
    ]
  },
  {
    id: 'o3',
    unit: 'Grupo VcChic',
    objective: 'Caixa Previsível & Dropshipping',
    progress: 60,
    keyResults: [
      { text: 'ROAS médio Grupo ≥ 2.5', completed: true },
      { text: 'Margem bruta média ≥ 45%', completed: false },
      { text: 'Mivave: Validar coleção Inverno', completed: true }
    ]
  },
  {
    id: 'o4',
    unit: 'Personal',
    objective: 'Cadência do CEO',
    progress: 80,
    keyResults: [
      { text: '48 semanas com rotina cumprida', completed: true },
      { text: '2 encontros familiares/semana (60% das semanas)', completed: true },
      { text: 'Treino 6x/semana', completed: true }
    ]
  }
];

// Based on "5) Agenda semanal tipo CEO"
export const DAILY_ROUTINE: ScheduleBlock[] = [
  { time: '06:30 - 07:30', activity: 'Treino Físico', type: 'Health' },
  { time: '08:00 - 08:30', activity: 'Leitura Manhã (Mercado)', type: 'Learning' },
  { time: '08:30 - 11:30', activity: 'Deep Work 1 (Prioridade 1)', type: 'Deep Work' },
  { time: '11:30 - 13:00', activity: 'Almoço / Descanso', type: 'Rest' },
  { time: '13:00 - 14:30', activity: 'Estudo: Business Mastery & IA', type: 'Learning' },
  { time: '14:30 - 16:30', activity: 'Deep Work 2 (Operacional)', type: 'Deep Work' },
  { time: '16:30 - 18:30', activity: 'Gestão / Financeiro / E-mails', type: 'Meeting' },
  { time: '18:30 - 20:30', activity: 'Família / Jantar', type: 'Rest' },
  { time: '20:30 - 21:00', activity: 'Leitura Noite (Filosofia/Bio)', type: 'Learning' },
  { time: '21:00 - 06:00', activity: 'Higiene do Sono', type: 'Health' }
];

// Mock Leads based on "Nexus" and "Mapa"
export const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Carlos Silva', email: 'carlos@example.com', source: 'Organic', status: LeadStatus.NEW, value: 0, product: 'Nexus', createdAt: '2025-10-01' },
  { id: '2', name: 'Ana Souza', email: 'ana@tech.com', source: 'Paid', status: LeadStatus.DIAGNOSTIC_SCHEDULED, value: 5000, product: 'Nexus', createdAt: '2025-10-02' },
  { id: '3', name: 'Roberto Firmino', email: 'beto@store.com', source: 'Indication', status: LeadStatus.PROPOSAL, value: 5000, product: 'Nexus', createdAt: '2025-09-28' },
  { id: '4', name: 'Julia Roberts', email: 'juju@art.com', source: 'Organic', status: LeadStatus.WON, value: 297, product: 'Mapa da Clareza', createdAt: '2025-09-20' },
  { id: '5', name: 'Marcos Paulo', email: 'mp@mail.com', source: 'Paid', status: LeadStatus.DIAGNOSTIC_SCHEDULED, value: 997, product: 'Projeto Respirar', createdAt: '2025-10-05' },
  { id: '6', name: 'Fernanda Lima', email: 'fe@design.com', source: 'Organic', status: LeadStatus.PROPOSAL, value: 1500, product: 'Formação 3D', createdAt: '2025-10-06' },
];

export const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Revisar ROAS VcChic (Loja Principal)', type: 'Big Rock', completed: false, category: 'VcChic' },
  { id: '2', title: 'Gravar 3 vídeos curtos', type: 'Medium', completed: true, category: '3D Digital' },
  { id: '3', title: 'Validar Fornecedores Sezo', type: 'Medium', completed: false, category: 'Sezo' },
  { id: '4', title: 'Reunião Branding Moriel', type: 'Medium', completed: false, category: 'Moriel' },
  { id: '5', title: 'Estudar Payback vs. LTV', type: 'Small', completed: true, category: 'Personal' },
  { id: '6', title: 'Checar e-mail suporte Mivave', type: 'Small', completed: false, category: 'Mivave' },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Daily Check-in Grupo VcChic', start: '09:00', end: '09:30', type: 'meeting', attendees: ['Paula', 'Time'], dayOffset: 0 },
  { id: '2', title: 'Gravação Conteúdo 3D', start: '10:00', end: '11:00', type: 'deep_work', dayOffset: 0 },
  
  // Mapa da Clareza integrado ao Deep Work 2 (Hoje)
  { id: 'mapa1', title: 'Diagnóstico Mapa: Marcos Paulo', start: '15:00', end: '16:00', type: 'call', attendees: ['Marcos Paulo'], dayOffset: 0 },
  
  { id: '4', title: 'Revisão Financeira Mensal', start: '16:30', end: '18:00', type: 'deep_work', dayOffset: 0 },
  
  // Mapa da Clareza integrado ao Deep Work 1 (Amanhã)
  { id: 'mapa2', title: 'Diagnóstico Mapa: Julia R.', start: '09:00', end: '10:00', type: 'call', attendees: ['Julia Roberts'], dayOffset: 1 },
  
  { id: '5', title: 'Alinhamento Fornecedores Moriel', start: '10:00', end: '11:00', type: 'meeting', attendees: ['Fornecedor A'], dayOffset: 1 },
  { id: '6', title: 'Escrever E-mail Mkt Mivave', start: '14:30', end: '16:00', type: 'deep_work', dayOffset: 1 },
  
  { id: '7', title: 'Live Tira-Dúvidas Alunos', start: '19:00', end: '20:30', type: 'call', attendees: ['Alunos 3D'], dayOffset: 2 },
];

export const MOCK_CALL_LOGS: CallLog[] = [
  {
    id: 'c3',
    leadName: 'Marcos Paulo',
    date: 'Hoje, 15:00',
    duration: '35 min',
    type: 'Mapa da Clareza',
    status: 'Completed',
    sentiment: 'Negative',
    transcriptSnippet: "[Call Diagnóstico Paga]\n\nCarlos: Marcos, vi no Mapa que sua maior dor hoje é financeira. Explica melhor.\nMarcos: Cara, tô devendo 20k no cartão. Não durmo direito. Tentei dropshipping e perdi dinheiro.\nCarlos: Você tem reserva?\nMarcos: Zero. Tô desesperado, preciso de algo pra ontem.\nCarlos: Calma. Aprender 3D agora vai demorar. Você precisa de resgate financeiro e organização mental primeiro.",
    summary: "Avatar Resgate. Endividado, ansioso e sem caixa. Perfil CLARO para Projeto Respirar."
  },
  {
    id: 'c4',
    leadName: 'Julia Roberts',
    date: 'Ontem, 09:00',
    duration: '30 min',
    type: 'Mapa da Clareza',
    status: 'Completed',
    sentiment: 'Positive',
    transcriptSnippet: "[Call Diagnóstico Paga]\n\nCarlos: Julia, seu Mapa mostra estabilidade. Você é CLT, certo?\nJulia: Sim, sou designer sênior numa agência. Ganho bem, mas tô cansada de bater ponto.\nCarlos: Entendi. O dinheiro não é o problema, é a liberdade.\nJulia: Exato. Quero viajar e trabalhar de casa. Tenho uma reserva de 6 meses.\nCarlos: Ótimo. Você não precisa de resgate, precisa de um plano de transição seguro.",
    summary: "Avatar Transição. CLT, estável financeiramente, busca liberdade geográfica. Perfil ideal para Formação 3D."
  },
  {
    id: 'c1',
    leadName: 'Ana Souza',
    date: 'Ontem, 14:30',
    duration: '45 min',
    type: 'Discovery',
    status: 'Completed',
    sentiment: 'Positive',
    transcriptSnippet: "Carlos: Olá Ana, tudo bem? Vi que você aplicou para o Nexus.\nAna: Oi Carlos! Sim, estou num momento de transição. Tenho uma agência, mas quero migrar para infoprodutos.\nCarlos: Entendo. Qual seu maior gargalo hoje?\nAna: Não tenho previsibilidade. Um mês ganho 20k, no outro zero.\nCarlos: O Nexus resolve exatamente isso com o funil perpétuo. Quanto você tem para investir em tráfego?\nAna: Cerca de 2k/mês.\nCarlos: É um bom começo. Se conseguirmos um ROAS de 3, faz sentido para você?\nAna: Com certeza, onde assino?",
    summary: "Lead qualificada (Dona de Agência). Dor principal: falta de previsibilidade. Orçamento confirmado."
  }
];