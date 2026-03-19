
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { useAppStore } from '../store/useAppStore';
import { leadsService } from '../services/leadsService';
import { eventsService } from '../services/eventsService';
import { callLogsService } from '../services/callLogsService';
import { Plus, Clock, X, Save, Loader2, Sparkles, Thermometer, Zap, Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Pipeline: React.FC = () => {
  const { leads, addLead, updateLead, addEvent, addCallLog } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', email: '', product: 'Nexus', source: 'Organic', value: 0, status: LeadStatus.NEW
  });

  const [scheduleData, setScheduleData] = useState({
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      type: 'Mapa da Clareza'
  });

  const kanbanColumns = [
    { id: LeadStatus.NEW, title: 'Novos', text: 'text-blue-600', bg: 'bg-blue-50' },
    { id: LeadStatus.DIAGNOSTIC_SCHEDULED, title: 'Diagnóstico', text: 'text-amber-600', bg: 'bg-amber-50' },
    { id: LeadStatus.PROPOSAL, title: 'Oferta', text: 'text-purple-600', bg: 'bg-purple-50' },
    { id: LeadStatus.WON, title: 'Vendido', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const allProjectLeads = leads.filter(l => ['Nexus', 'Mapa da Clareza', 'Formação 3D', 'Projeto Respirar'].includes(l.product));
  const conversionRate = allProjectLeads.length > 0
    ? ((allProjectLeads.filter(l => l.status === LeadStatus.WON).length / allProjectLeads.length) * 100).toFixed(1)
    : '0.0';
  const projectLeads = allProjectLeads.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
      const originalStatus = leads.find(l => l.id === leadId)?.status;
      updateLead(leadId, { status: newStatus });

      const { error } = await leadsService.update(leadId, { status: newStatus });
      if (error && originalStatus) {
          updateLead(leadId, { status: originalStatus });
          toast.error("Erro ao mover lead. Sincronização falhou.");
      }
  };

  const handleSaveLead = async () => {
      if (!newLead.name) return;
      setIsSaving(true);
      try {
          const { data, error } = await leadsService.create({
              name: newLead.name ?? '',
              email: newLead.email ?? '',
              product: newLead.product ?? 'Nexus',
              source: newLead.source ?? 'Organic',
              value: newLead.value ?? 0,
              status: newLead.status ?? LeadStatus.NEW,
          });
          if (error) throw new Error(error);
          if (data) addLead(data);
          setIsModalOpen(false);
          setNewLead({ name: '', email: '', product: 'Nexus', source: 'Organic', value: 0, status: LeadStatus.NEW });
      } catch (err) { toast.error("Erro ao salvar lead. Verifique os dados e sua conexão."); } finally { setIsSaving(false); }
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
              end: "18:00",
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
              transcriptSnippet: `Agendamento automático via Pipeline CRM. Foco: ${selectedLead.product}`,
              summary: `Call de ${scheduleData.type} agendada.`,
              duration: '',
          });

          if (selectedLead.status === LeadStatus.NEW) {
              const { error: leadErr } = await leadsService.update(selectedLead.id, { status: LeadStatus.DIAGNOSTIC_SCHEDULED });
              if (!leadErr) updateLead(selectedLead.id, { status: LeadStatus.DIAGNOSTIC_SCHEDULED });
          }

          if (eventErr || logErr) throw new Error("Erro na sincronização tripla.");

          if (eventData) addEvent(eventData);
          if (logData) addCallLog(logData);
          setIsScheduleModalOpen(false);
          setSelectedLead(null);
      } catch (e) {
          toast.error("Falha ao sincronizar com o ecossistema.");
      } finally {
          setIsSaving(false);
      }
  };

  const getDaysInPipeline = (dateStr?: string) => {
      if (!dateStr) return 0;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 0;
      return Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
  };

  const getHeatColor = (days: number, status: LeadStatus) => {
      if (status === LeadStatus.WON) return 'text-emerald-500 bg-emerald-50';
      if (days > 5) return 'text-rose-500 bg-rose-50';
      if (days > 2) return 'text-amber-500 bg-amber-50';
      return 'text-blue-500 bg-blue-50';
  };

  const moveStatus = (currentStatus: LeadStatus, direction: 'next' | 'prev'): LeadStatus | null => {
      const idx = kanbanColumns.findIndex(c => c.id === currentStatus);
      if (direction === 'next' && idx < kanbanColumns.length - 1) return kanbanColumns[idx + 1].id as LeadStatus;
      if (direction === 'prev' && idx > 0) return kanbanColumns[idx - 1].id as LeadStatus;
      return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">CRM <span className="text-blue-600">INTEL</span></h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Gestão Térmica de Oportunidades</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pipe Ativo</span>
                  <span className="text-sm font-black text-slate-900">R$ {projectLeads.reduce((acc, l) => acc + l.value, 0).toLocaleString()}</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-100"></div>
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Taxa Conversão</span>
                  <span className="text-sm font-black text-emerald-500">{conversionRate}%</span>
              </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20"><Plus size={16} /> Novo Lead</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
        <Search size={16} className="text-slate-300 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar lead..."
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

      {/* Kanban Board */}
      <div className="overflow-x-auto min-h-0" style={{ height: 'calc(100vh - 280px)' }}>
        <div className="flex gap-6 min-w-[1200px] h-full pb-2">
          {kanbanColumns.map(col => {
            const items = projectLeads.filter(l => l.status === col.id);
            return (
            <div key={col.id} className="flex-1 bg-white/40 border border-slate-100 rounded-[2.5rem] flex flex-col p-4 shadow-sm min-w-[260px] min-h-0">
              <div className="p-4 mb-2 flex justify-between items-center flex-shrink-0">
                  <h3 className={`font-black text-[10px] uppercase tracking-[0.2em] ${col.text}`}>{col.title}</h3>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 italic">R$ {items.reduce((acc, l) => acc + l.value, 0).toLocaleString()}</span>
                      <span className="bg-white border border-slate-100 text-slate-900 text-[10px] px-2.5 py-1 rounded-lg font-black shadow-sm">
                        {items.length}
                      </span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#B0B0B0 transparent' }}>
                {items.map(lead => {
                    const days = getDaysInPipeline(lead.createdAt);
                    const heat = getHeatColor(days, lead.status as LeadStatus);
                    const nextSt = moveStatus(lead.status as LeadStatus, 'next');
                    const prevSt = moveStatus(lead.status as LeadStatus, 'prev');

                    return (
                    <motion.div layout key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-blue-500 transition-all group relative">
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-[-5px] group-hover:translate-y-0">
                             {prevSt && (
                                 <button onClick={() => handleUpdateStatus(lead.id, prevSt)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors" title="Voltar Status">
                                    <ChevronLeft size={14} />
                                 </button>
                             )}
                             <button
                                onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setIsScheduleModalOpen(true); }}
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

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs uppercase">
                                    {lead.name.substring(0,2)}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-xs group-hover:text-blue-600 transition-colors">{lead.name}</h4>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lead.product}</span>
                                </div>
                            </div>
                            <div className={`p-1.5 rounded-lg ${heat} transition-colors`}>
                                <Thermometer size={14} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-2">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-300" />
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${days > 3 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {days === 0 ? 'Hoje' : `${days} dias`}
                                </span>
                            </div>
                            <span className="text-xs font-black text-slate-900 tracking-tighter">R$ {lead.value.toLocaleString()}</span>
                        </div>
                    </motion.div>
                )})}
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* Modal: Inject Lead — shadcn Dialog (FocusTrap + ESC nativos via Radix) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-[3rem] max-w-xl p-0 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
          <div className="p-10 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
            <div className="p-3 bg-blue-600 text-white rounded-2xl"><Sparkles size={20} /></div>
            <h3 className="font-black text-slate-900 text-2xl tracking-tighter uppercase italic">Inject <span className="text-blue-600">Lead</span></h3>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação do Cliente</label>
              <input type="text" placeholder="Nome Completo" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" aria-label="Nome do lead" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Produto Principal</label>
                <select value={newLead.product} onChange={(e) => setNewLead({...newLead, product: e.target.value as Lead['product']})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-xs uppercase outline-none" aria-label="Produto principal">
                  <option value="Nexus">Nexus</option>
                  <option value="Mapa da Clareza">Mapa da Clareza</option>
                  <option value="Formação 3D">Formação 3D</option>
                  <option value="Projeto Respirar">Projeto Respirar</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor de Pipeline (R$)</label>
                <input type="number" placeholder="0" value={newLead.value} onChange={(e) => setNewLead({...newLead, value: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none" aria-label="Valor do pipeline" />
              </div>
            </div>
          </div>
          <div className="p-10 bg-slate-50/50 flex gap-4">
            <button onClick={handleSaveLead} disabled={isSaving || !newLead.name} className="flex-1 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Sync to Cloud
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Quick Schedule — shadcn Dialog (FocusTrap + ESC nativos via Radix) */}
      <Dialog open={isScheduleModalOpen && !!selectedLead} onOpenChange={(open) => { if (!open) { setIsScheduleModalOpen(false); setSelectedLead(null); } }}>
        <DialogContent className="rounded-[3rem] max-w-lg p-0 overflow-hidden">
          {selectedLead && <>
            <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
              <div className="p-3 bg-blue-600 text-white rounded-2xl"><Zap size={20} /></div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase italic leading-none">Quick Schedule</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.name}</span>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" aria-label="Data da call" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                  <input type="time" value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" aria-label="Hora da call" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Call</label>
                <select value={scheduleData.type} onChange={(e) => setScheduleData({...scheduleData, type: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none" aria-label="Tipo de call">
                  <option value="Mapa da Clareza">Mapa da Clareza (Pago)</option>
                  <option value="Discovery">Discovery (Gratuito)</option>
                  <option value="Closing">Fechamento (Closing)</option>
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
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pipeline;
