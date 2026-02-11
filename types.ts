
export type BusinessUnit = '3D Digital' | 'Grupo VcChic' | 'VcChic' | 'Mivave' | 'Sezo' | 'Moriel' | 'Personal';

export enum LeadStatus {
  NEW = 'Novo',
  CONTACTED = 'Contatado',
  DIAGNOSTIC_SCHEDULED = 'Diagnóstico Agendado',
  PROPOSAL = 'Proposta Enviada',
  WON = 'Vendido',
  LOST = 'Perdido'
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  source: 'Organic' | 'Paid' | 'Indication';
  status: LeadStatus;
  value: number; // Potential value
  product: 'Nexus' | 'Mapa da Clareza' | 'Formação 3D' | 'Projeto Respirar';
  createdAt: string;
}

export interface Metric {
  label: string;
  value: string | number;
  change: number; // percentage
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
  type: 'Big Rock' | 'Medium' | 'Small'; // 1-3-5 Rule
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
  start: string; // ISO String or HH:mm if today
  end: string;
  type: 'meeting' | 'deep_work' | 'personal' | 'call';
  attendees?: string[];
  dayOffset: number; // 0 = today, 1 = tomorrow, etc. (for mocking)
}

export interface CallLog {
  id: string;
  leadName: string;
  date: string;
  duration: string;
  type: 'Discovery' | 'Closing' | 'Mentorship' | 'Mapa da Clareza';
  status: 'Completed' | 'Missed' | 'Scheduled';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  transcriptSnippet: string; // Mock transcript
  summary?: string;
  recordingUrl?: string; // Mock
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

// Supabase Row Types (snake_case matching DB columns)
export interface LeadRow {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  value: number;
  product: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  type: 'Big Rock' | 'Medium' | 'Small';
  completed: boolean;
  category: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: string;
  attendees?: string[];
  day_offset: number;
}

export interface CallLogRow {
  id: string;
  lead_name: string;
  date: string;
  duration: string;
  type: string;
  status: string;
  sentiment: string;
  transcript_snippet: string;
  summary?: string;
  created_at: string;
}

export interface OKRRow {
  id: string;
  unit: string;
  objective: string;
  progress: number;
  key_results: { text: string; completed: boolean }[];
  created_at: string;
}
