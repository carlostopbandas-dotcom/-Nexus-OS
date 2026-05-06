
export type BusinessUnit = '3D Digital' | 'Grupo VcChic' | 'VcChic' | 'Mivave' | 'Sezo' | 'Moriel' | 'Personal';

export type LeadBusinessUnit = '3D Digital' | 'Grupo VcChic';

export type LeadProduct =
  // 3D Digital — B2B
  | 'Negócio Sólido'
  | 'NexIA — Cohort B2C'
  | 'NexIA — Mentoria 1:1'
  | 'NexIA — Programa Empresarial'
  | 'NexIA — Retainer'
  | 'Ecossistema de Negócios'
  | 'Diagnóstico Gratuito'
  // 3D Digital — B2C
  | 'Nexus de Negócios'
  // Grupo VcChic
  | 'Motor 2';

export const PRODUCT_BUSINESS_UNIT: Record<LeadProduct, LeadBusinessUnit> = {
  'Negócio Sólido':              '3D Digital',
  'NexIA — Cohort B2C':          '3D Digital',
  'NexIA — Mentoria 1:1':        '3D Digital',
  'NexIA — Programa Empresarial':'3D Digital',
  'NexIA — Retainer':            '3D Digital',
  'Ecossistema de Negócios':     '3D Digital',
  'Diagnóstico Gratuito':        '3D Digital',
  'Nexus de Negócios':           '3D Digital',
  'Motor 2':                     'Grupo VcChic',
};

export const PRODUCT_GROUPS: { label: string; unit: LeadBusinessUnit; products: LeadProduct[] }[] = [
  {
    label: '3D Digital — B2B',
    unit: '3D Digital',
    products: ['Diagnóstico Gratuito', 'Negócio Sólido', 'NexIA — Cohort B2C', 'NexIA — Mentoria 1:1', 'NexIA — Programa Empresarial', 'NexIA — Retainer', 'Ecossistema de Negócios'],
  },
  {
    label: '3D Digital — B2C',
    unit: '3D Digital',
    products: ['Nexus de Negócios'],
  },
  {
    label: 'Grupo VcChic',
    unit: 'Grupo VcChic',
    products: ['Motor 2'],
  },
];

export type UserRole = 'ceo' | 'gestor_vcchic' | 'vendedor_sdr' | 'assistente';

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string | null;
  email: string | null;
  onboardedAt: string | null;
  createdAt: string;
}

export enum LeadStatus {
  NEW = 'Novo',
  CONTACTED = 'Contatado',
  DIAGNOSTIC_SCHEDULED = 'Diagnóstico Agendado',
  PROPOSAL = 'Proposta Enviada',
  NEGOTIATING = 'Em Negociação',
  WON = 'Vendido',
  LOST = 'Perdido'
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  source: 'Organic' | 'Paid' | 'Indication' | 'Network';
  status: LeadStatus;
  value: number;
  product: LeadProduct;
  businessUnit: LeadBusinessUnit;
  module?: 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'Jornada Completa';
  painPoint?: string;
  nextAction?: string;
  clientStage?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface Metric {
  label: string;
  value: string | number;
  change: number;
  unit: string;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

export interface OKR {
  id: string;
  objective: string;
  unit: BusinessUnit;
  progress: number;
  keyResults: { text: string; completed: boolean }[];
}

export interface Task {
  id: string;
  title: string;
  type: 'Big Rock' | 'Medium' | 'Small';
  completed: boolean;
  category: BusinessUnit;
}

export interface ScheduleBlock {
  time: string;
  activity: string;
  type: 'Deep Work' | 'Health' | 'Meeting' | 'Rest' | 'Learning';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'meeting' | 'deep_work' | 'personal' | 'call';
  attendees?: string[];
  dayOffset: number;
}

export interface CallLog {
  id: string;
  leadName: string;
  date: string;
  duration: string;
  type: 'Discovery' | 'Closing' | 'Mentorship' | 'Mapa da Clareza';
  status: 'Completed' | 'Missed' | 'Scheduled';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  transcriptSnippet: string;
  summary?: string;
  recordingUrl?: string;
}

export type Platform = 'linkedin' | 'instagram' | 'newsletter';

export interface Post {
    id: string;
    platform: Platform;
    content: string;
    imagePrompt?: string;
    status: 'Draft' | 'Scheduled' | 'Published';
    date: string;
    stats?: { likes: number; views: number };
}

export interface StoreMetric {
  id?: string;
  store_name: string;
  sales: number;
  spend: number;
  roas: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}
