
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead, LeadStatus, LeadProduct, LeadBusinessUnit, PRODUCT_BUSINESS_UNIT, PRODUCT_GROUPS } from '../types';
import { useAppStore } from '../store/useAppStore';
import { leadsService } from '../services/leadsService';
import { eventsService } from '../services/eventsService';
import { callLogsService } from '../services/callLogsService';
import { Plus, Clock, X, Save, Loader2, Sparkles, Thermometer, Zap, Check, ChevronLeft, ChevronRight, Search, UserCheck } from 'lucide-react';
import { useLeadAIScore } from '../hooks/useLeadAIScore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type PipelineView = 'Todos' | '3D Digital' | 'Grupo VcChic';

const UNIT_STYLES: Record<LeadBusinessUnit, { dot: string; badge: string; border: string }> = {
  '3D Digital':    { dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-600',   border: 'border-l-indigo-400' },
  'Grupo VcChic':  { dot: 'bg-pink-500',    badge: 'bg-pink-50 text-pink-600',       border: 'border-l-pink-400'   },
};

const PRODUCT_COLOR: Record<LeadProduct, string> = {
  'Diagnóstico Gratuito':        'bg-slate-100 text-slate-500',
  'Negócio Sólido':              'bg-indigo-100 text-indigo-700',
  'NexIA — Cohort B2C':          'bg-violet-100 text-violet-700',
  'NexIA — Mentoria 1:1':        'bg-violet-100 text-violet-700',
  'NexIA — Programa Empresarial':'bg-violet-100 text-violet-700',
  'NexIA — Retainer':            'bg-violet-100 text-violet-700',
  'Ecossistema de Negócios':     'bg-amber-100 text-amber-700',
  'Nexus de Negócios':           'bg-blue-100 text-blue-700',
  'Motor 2':                     'bg-pink-100 text-pink-700',
};

const DEFAULT_LEAD: Partial<Lead> = {
  name: '', email: '', whatsapp: '',
  product: 'Negócio Sólido',
  businessUnit: '3D Digital',
  source: 'Network', value: 0,
  status: LeadStatus.NEW,
  module: undefined, painPoint: '', nextAction: '',
};

const SCORE_BADGE: Record<'high' | 'mid' | 'low', string> = {
  high: 'bg-emerald-100 text-emerald-700',
  mid:  'bg-amber-100 text-amber-700',
  low:  'bg-rose-100 text-rose-700',
};

const AIScoreBadge: React.FC<{ lead: Lead }> = ({ lead }) => {
  const { score, suggestion, loading, analyze } = useLeadAIScore(lead);

  if (score !== null) {
    const tier = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
    return (
      <div className="mt-3 flex flex-col gap-1">
        <span className={`self-start px-2 py-0.5 rounded-full text-[10px] font-black ${SCORE_BADGE[tier]}`}>
          Score {score}
        </span>
        {suggestion && (
          <p className="text-[9px] italic text-slate-400 leading-tight">{suggestion}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={analyze}
      disabled={loading}
      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-100 transition-all disabled:opacity-60"
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
      {loading ? 'Analisando...' : 'AI Score'}
    </button>
  );
};

const Pipeline: React.FC = () => {
  const navigate = useNavigate();
  const { leads, addLead, updateLead, addEvent, addCallLog } = useAppStore();
  const [activeView, setActiveView] = useState<PipelineView>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLead, setNewLead] = useState<Partial<Lead>>(DEFAULT_LEAD);

  const [scheduleData, setScheduleData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    type: 'Discovery',
  });

  const kanbanColumns = [
    { id: LeadStatus.NEW,                  title: 'Novos',       text: 'text-blue-600',    bg: 'bg-blue-50'    },
    { id: LeadStatus.CONTACTED,            title: 'Contatado',   text: 'text-sky-600',     bg: 'bg-sky-50'     },
    { id: LeadStatus.DIAGNOSTIC_SCHEDULED, title: 'Diagnóstico', text: 'text-amber-600',   bg: 'bg-amber-50'   },
    { id: LeadStatus.PROPOSAL,             title: 'Proposta',    text: 'text-purple-600',  bg: 'bg-purple-50'  },
    { id: LeadStatus.NEGOTIATING,          title: 'Negociação',  text: 'text-orange-600',  bg: 'bg-orange-50'  },
    { id: LeadStatus.WON,                  title: 'Vendido',     text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: LeadStatus.LOST,                 title: 'Perdido',     text: 'text-rose-400',    bg: 'bg-rose-50'    },
  ];

  const viewLeads = leads.filter(l => {
    const matchesView = activeView === 'Todos' || (l.businessUnit ?? PRODUCT_BUSINESS_UNIT[l.product]) === activeView;
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesView && matchesSearch;
  });

  const totalPipe = viewLeads.reduce((acc, l) => acc + l.value, 0);
  const wonLeads = viewLeads.filter(l => l.status === LeadStatus.WON);
  const conversionRate = viewLeads.length > 0
    ? ((wonLeads.length / viewLeads.length) * 100).toFixed(1)
    : '0.0';

  const handleProductChange = (product: LeadProduct) => {
    setNewLead(prev => ({ ...prev, product, businessUnit: PRODUCT_BUSINESS_UNIT[product], module: undefined }));
  };

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    const original = leads.find(l => l.id === leadId)?.status;
    updateLead(leadId, { status: newStatus });
    const { error } = await leadsService.update(leadId, { status: newStatus });
    if (error && original) {
      updateLead(leadId, { status: original });
      toast.error('Erro ao mover lead. Sincronização falhou.');
    }
  };

  const handleSaveLead = async () => {
    if (!newLead.name) return;
    setIsSaving(true);
    try {
      const product = newLead.product ?? 'Negócio Sólido';
      const { data, error } = await leadsService.create({
        name: newLead.name ?? '',
        email: newLead.email ?? '',
        whatsapp: newLead.whatsapp ?? '',
        product,
        businessUnit: PRODUCT_BUSINESS_UNIT[product],
        source: newLead.source ?? 'Network',
        value: newLead.value ?? 0,
        status: newLead.status ?? LeadStatus.NEW,
        module: newLead.module,
        painPoint: newLead.painPoint ?? '',
        nextAction: newLead.nextAction ?? '',
      });
      if (error) throw new Error(error);
      if (data) addLead(data);
      setIsModalOpen(false);
      setNewLead(DEFAULT_LEAD);
    } catch { toast.error('Erro ao salvar lead.'); } finally { setIsSaving(false); }
  };

  const handleQuickSchedule = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const today = new Date();
      const targetDate = new Date(scheduleData.date);
      const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      const { data: eventData, error: eventErr } = await eventsService.create({
        title: `${scheduleData.type}: ${selectedLead.name}`,
        start: scheduleData.time,
        end: '18:00',
        type: 'call',
        attendees: [selectedLead.name],
        dayOffset,
      });

      const { data: logData, error: logErr } = await callLogsService.create({
        leadName: selectedLead.name,
        date: `${scheduleData.date} ${scheduleData.time}`,
        type: scheduleData.type as 'Discovery' | 'Closing' | 'Mentorship' | 'Mapa da Clareza',
        status: 'Scheduled',
        sentiment: 'Neutral',
        transcriptSnippet: `Agendamento automático via Pipeline CRM. Produto: ${selectedLead.product}`,
        summary: `Call de ${scheduleData.type} agendada.`,
        duration: '',
      });

      if (selectedLead.status === LeadStatus.NEW) {
        const { error: leadErr } = await leadsService.update(selectedLead.id, { status: LeadStatus.DIAGNOSTIC_SCHEDULED });
        if (!leadErr) updateLead(selectedLead.id, { status: LeadStatus.DIAGNOSTIC_SCHEDULED });
      }

      if (eventErr || logErr) throw new Error('Erro na sincronização.');
      if (eventData) addEvent(eventData);
      if (logData) addCallLog(logData);
      setIsScheduleModalOpen(false);
      setSelectedLead(null);
      toast.success('Call agendada e sincronizada!');
    } catch { toast.error('Falha ao sincronizar com o ecossistema.'); } finally { setIsSaving(false); }
  };

  const getDaysInPipeline = (dateStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 0;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 3600 * 24));
  };

  const getHeatColor = (days: number, status: LeadStatus) => {
    if (status === LeadStatus.WON) return 'text-emerald-500 bg-emerald-50';
    if (days > 5) return 'text-rose-500 bg-rose-50';
    if (days > 2) return 'text-amber-500 bg-amber-50';
    return 'text-blue-500 bg-blue-50';
  };

  const moveStatus = (current: LeadStatus, dir: 'next' | 'prev'): LeadStatus | null => {
    const idx = kanbanColumns.findIndex(c => c.id === current);
    if (dir === 'next' && idx < kanbanColumns.length - 1) return kanbanColumns[idx + 1].id;
    if (dir === 'prev' && idx > 0) return kanbanColumns[idx - 1].id;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">CRM <span className="text-blue-600">INTEL</span></h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Gestão Térmica de Oportunidades</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View tabs */}
          <div className="flex bg-white shadow-xl shadow-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-100">
            {(['Todos', '3D Digital', 'Grupo VcChic'] as PipelineView[]).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 md:px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeView === view ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Stats — oculto no mobile */}
          <div className="hidden md:flex bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pipe Ativo</span>
              <span className="text-sm font-black text-slate-900">R$ {totalPipe.toLocaleString('pt-BR')}</span>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Conversão</span>
              <span className="text-sm font-black text-emerald-500">{conversionRate}%</span>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leads</span>
              <span className="text-sm font-black text-slate-900">{viewLeads.length}</span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 md:px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20"
          >
            <Plus size={16} /> <span className="hidden md:inline">Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
        <Search size={16} className="text-slate-300 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar lead por nome..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 text-xs font-bold text-slate-700 placeholder-slate-300 outline-none bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-slate-600 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="min-h-0 md:overflow-x-auto" style={{ height: 'auto' }}>
        <div className="flex flex-col md:flex-row gap-6 md:min-w-[1200px] pb-2">
          {kanbanColumns.map(col => {
            const items = viewLeads.filter(l => l.status === col.id);
            return (
              <div key={col.id} className="flex-1 bg-white/40 border border-slate-100 rounded-[2.5rem] flex flex-col p-4 shadow-sm md:min-w-[260px] min-h-0">
                <div className="p-4 mb-2 flex justify-between items-center flex-shrink-0">
                  <h3 className={`font-black text-[10px] uppercase tracking-[0.2em] ${col.text}`}>{col.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 italic">R$ {items.reduce((a, l) => a + l.value, 0).toLocaleString('pt-BR')}</span>
                    <span className="bg-white border border-slate-100 text-slate-900 text-[10px] px-2.5 py-1 rounded-lg font-black shadow-sm">{items.length}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#B0B0B0 transparent' }}>
                  {items.map(lead => {
                    const days = getDaysInPipeline(lead.createdAt);
                    const heat = getHeatColor(days, lead.status);
                    const nextSt = moveStatus(lead.status, 'next');
                    const prevSt = moveStatus(lead.status, 'prev');
                    const unit = lead.businessUnit ?? PRODUCT_BUSINESS_UNIT[lead.product] ?? '3D Digital';
                    const unitStyle = UNIT_STYLES[unit as LeadBusinessUnit];
                    const productColor = PRODUCT_COLOR[lead.product] ?? 'bg-slate-100 text-slate-500';

                    return (
                      <motion.div
                        layout
                        key={lead.id}
                        className={`bg-white p-5 rounded-[2rem] border border-l-4 ${unitStyle.border} border-slate-100 shadow-xl shadow-slate-200/20 hover:border-blue-200 transition-all group relative`}
                      >
                        {/* Action buttons on hover */}
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-[-5px] group-hover:translate-y-0">
                          {prevSt && (
                            <button onClick={() => handleUpdateStatus(lead.id, prevSt)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors" title="Voltar Status">
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedLead(lead); setIsScheduleModalOpen(true); }}
                            className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                            title="Agendar Call"
                          >
                            <Zap size={14} fill="currentColor" />
                          </button>
                          {nextSt && (
                            <button onClick={() => handleUpdateStatus(lead.id, nextSt)} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors" title="Avançar Lead">
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>

                        {/* Card header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs uppercase flex-shrink-0">
                              {lead.name.substring(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-900 text-xs group-hover:text-blue-600 transition-colors truncate">{lead.name}</h4>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${productColor}`}>
                                  {lead.product}
                                </span>
                                {lead.module && (
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                                    {lead.module}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`p-1.5 rounded-lg ${heat} transition-colors flex-shrink-0`}>
                            <Thermometer size={14} />
                          </div>
                        </div>

                        {/* Business unit badge */}
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${unitStyle.badge} mb-3`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${unitStyle.dot}`} />
                          {unit}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-300" />
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${days > 3 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {days === 0 ? 'Hoje' : `${days}d`}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-900">R$ {lead.value.toLocaleString('pt-BR')}</span>
                        </div>
                        {lead.status === LeadStatus.WON && (
                          <button
                            onClick={() => navigate('/clients')}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl text-[10px] font-black hover:bg-emerald-100 transition-all"
                          >
                            <UserCheck size={12} /> Ver em Clientes Ativos
                          </button>
                        )}
                        <AIScoreBadge lead={lead} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Inject Lead */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-[3rem] max-w-xl p-0 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
          <div className="p-10 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
            <div className="p-3 bg-blue-600 text-white rounded-2xl"><Sparkles size={20} /></div>
            <div>
              <h3 className="font-black text-slate-900 text-2xl tracking-tighter uppercase italic">Inject <span className="text-blue-600">Lead</span></h3>
              {newLead.businessUnit && (
                <span className={`text-[9px] font-black uppercase tracking-widest ${UNIT_STYLES[newLead.businessUnit].badge} px-2 py-0.5 rounded-full`}>
                  {newLead.businessUnit}
                </span>
              )}
            </div>
          </div>

          <div className="p-10 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                <input type="text" placeholder="Ex: João da Silva" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp</label>
                <input type="text" placeholder="(41) 99999-9999" value={newLead.whatsapp} onChange={e => setNewLead({ ...newLead, whatsapp: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail</label>
              <input type="email" placeholder="email@empresa.com.br" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Produto</label>
              <select
                value={newLead.product}
                onChange={e => handleProductChange(e.target.value as LeadProduct)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none"
              >
                {PRODUCT_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.products.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {newLead.product === 'Negócio Sólido' && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Módulo (pós-diagnóstico)</label>
                <select value={newLead.module ?? ''} onChange={e => setNewLead({ ...newLead, module: (e.target.value as Lead['module']) || undefined })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none">
                  <option value="">A definir no diagnóstico</option>
                  <option value="M1">M1 — Mentalidade de Dono</option>
                  <option value="M2">M2 — Liderança de Alto Nível</option>
                  <option value="M3">M3 — Equipe de Alto Rendimento</option>
                  <option value="M4">M4 — Fundação do Negócio</option>
                  <option value="M5">M5 — Operação Inteligente</option>
                  <option value="Jornada Completa">Jornada Completa (M1→M5)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Origem</label>
                <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value as Lead['source'] })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none">
                  <option value="Network">Network</option>
                  <option value="Indication">Indicação</option>
                  <option value="Organic">Orgânico</option>
                  <option value="Paid">Pago</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor (R$)</label>
                <input type="number" placeholder="0" value={newLead.value} onChange={e => setNewLead({ ...newLead, value: Number(e.target.value) })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Dor Principal</label>
                <input type="text" placeholder='Ex: "Trabalho 12h e não cresce"' value={newLead.painPoint} onChange={e => setNewLead({ ...newLead, painPoint: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Próxima Ação</label>
                <input type="text" placeholder='Ex: "Enviar proposta até sexta"' value={newLead.nextAction} onChange={e => setNewLead({ ...newLead, nextAction: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5" />
              </div>
            </div>
          </div>

          <div className="p-10 bg-slate-50/50 flex gap-4">
            <button onClick={handleSaveLead} disabled={isSaving || !newLead.name} className="flex-1 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-40">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Sync to Cloud
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Quick Schedule */}
      <Dialog open={isScheduleModalOpen && !!selectedLead} onOpenChange={open => { if (!open) { setIsScheduleModalOpen(false); setSelectedLead(null); } }}>
        <DialogContent className="rounded-[3rem] max-w-lg p-0 overflow-hidden">
          {selectedLead && (
            <>
              <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
                <div className="p-3 bg-blue-600 text-white rounded-2xl"><Zap size={20} /></div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase italic leading-none">Quick Schedule</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.name}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${PRODUCT_COLOR[selectedLead.product] ?? 'bg-slate-100 text-slate-500'}`}>
                      {selectedLead.product}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                    <input type="date" value={scheduleData.date} onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                    <input type="time" value={scheduleData.time} onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Call</label>
                  <select value={scheduleData.type} onChange={e => setScheduleData({ ...scheduleData, type: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none">
                    <option value="Discovery">Discovery (Gratuito)</option>
                    <option value="Mapa da Clareza">Mapa da Clareza (Diagnóstico)</option>
                    <option value="Closing">Fechamento</option>
                    <option value="Mentorship">Mentoria Individual</option>
                  </select>
                </div>
              </div>
              <div className="p-8 bg-slate-50/50">
                <button onClick={handleQuickSchedule} disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirmar & Sincronizar
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pipeline;
