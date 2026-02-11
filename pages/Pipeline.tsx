
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Plus, Clock, X, Save, Loader2, Sparkles, Thermometer, Zap, Check, ChevronLeft, ChevronRight, MoreVertical, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PipelineProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const Pipeline: React.FC<PipelineProps> = ({ leads, setLeads }) => {
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

  const projectLeads = leads
    .filter(l => ['Nexus', 'Mapa da Clareza', 'Formação 3D', 'Projeto Respirar'].includes(l.product))
    .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
      const originalLeads = [...leads];
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

      try {
          const { error } = await supabase
              .from('leads')
              .update({ status: newStatus })
              .eq('id', leadId);

          if (error) throw error;
          window.dispatchEvent(new CustomEvent('nexus-data-updated'));
      } catch (e) {
          setLeads(originalLeads);
          alert("Erro ao mover lead. Sincronização falhou.");
      }
  };

  const handleSaveLead = async () => {
      if (!newLead.name) return;
      setIsSaving(true);
      try {
          const { error } = await supabase.from('leads').insert({
              name: newLead.name, email: newLead.email, product: newLead.product,
              source: newLead.source, value: newLead.value, status: newLead.status,
              created_at: new Date().toISOString()
          });
          if (error) throw error;
          setIsModalOpen(false);
          setNewLead({ name: '', email: '', product: 'Nexus', source: 'Organic', value: 0, status: LeadStatus.NEW });
          window.dispatchEvent(new CustomEvent('nexus-data-updated'));
      } catch (err) { alert("Erro ao salvar."); } finally { setIsSaving(false); }
  };

  const handleQuickSchedule = async () => {
      if (!selectedLead) return;
      setIsSaving(true);

      try {
          const today = new Date();
          const targetDate = new Date(scheduleData.date);
          const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

          const { error: eventErr } = await supabase.from('events').insert({
              title: `${scheduleData.type}: ${selectedLead.name}`,
              start_time: scheduleData.time,
              end_time: "18:00",
              type: 'call',
              attendees: [selectedLead.name],
              day_offset: dayOffset
          });

          const { error: logErr } = await supabase.from('call_logs').insert({
              lead_name: selectedLead.name,
              date: `${scheduleData.date} ${scheduleData.time}`,
              type: scheduleData.type,
              status: 'Scheduled',
              sentiment: 'Neutral',
              transcript_snippet: `Agendamento automático via Pipeline CRM. Foco: ${selectedLead.product}`,
              summary: `Call de ${scheduleData.type} agendada.`
          });

          if (selectedLead.status === LeadStatus.NEW) {
              await supabase.from('leads').update({ status: LeadStatus.DIAGNOSTIC_SCHEDULED }).eq('id', selectedLead.id);
          }

          if (eventErr || logErr) throw new Error("Erro na sincronização tripla.");

          setIsScheduleModalOpen(false);
          setSelectedLead(null);
          window.dispatchEvent(new CustomEvent('nexus-data-updated'));
      } catch (e) {
          alert("Falha ao sincronizar com o ecossistema.");
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
        <div className="flex gap-4 items-center">
          <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar lead..."
                className="pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm w-48 transition-all"
              />
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pipe Ativo</span>
                  <span className="text-sm font-black text-slate-900">R$ {projectLeads.reduce((acc, l) => acc + l.value, 0).toLocaleString()}</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-100"></div>
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Taxa Conversão</span>
                  <span className="text-sm font-black text-emerald-500">14.2%</span>
              </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20"><Plus size={16} /> Novo Lead</button>
        </div>
      </div>

      {/* Kanban Board - Grid 4 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: 'calc(100vh - 220px)' }}>
          {kanbanColumns.map(col => {
            const items = projectLeads.filter(l => l.status === col.id);
            return (
            <div key={col.id} className="bg-white/40 border border-slate-100 rounded-[2rem] flex flex-col p-3 shadow-sm" style={{ minHeight: 0, overflow: 'hidden' }}>
              <div className="p-4 mb-2 flex justify-between items-center" style={{ flexShrink: 0 }}>
                  <h3 className={`font-black text-[10px] uppercase tracking-[0.2em] ${col.text}`}>{col.title}</h3>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 italic">R$ {items.reduce((acc, l) => acc + l.value, 0).toLocaleString()}</span>
                      <span className="bg-white border border-slate-100 text-slate-900 text-[10px] px-2.5 py-1 rounded-lg font-black shadow-sm">
                        {items.length}
                      </span>
                  </div>
              </div>

              <div className="space-y-4 px-2" style={{ flex: '1 1 0%', overflowY: 'auto', minHeight: 0 }}>
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

      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] w-full max-w-xl overflow-hidden border border-slate-100">
                    <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 text-white rounded-2xl"><Sparkles size={20} /></div>
                            <h3 className="font-black text-slate-900 text-2xl tracking-tighter uppercase italic">Inject <span className="text-blue-600">Lead</span></h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all"><X size={24} /></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação do Cliente</label>
                            <input type="text" placeholder="Nome Completo" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Produto Principal</label>
                                <select value={newLead.product} onChange={(e) => setNewLead({...newLead, product: e.target.value as any})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-xs uppercase outline-none">
                                    <option value="Nexus">Nexus</option>
                                    <option value="Mapa da Clareza">Mapa da Clareza</option>
                                    <option value="Formação 3D">Formação 3D</option>
                                    <option value="Projeto Respirar">Projeto Respirar</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor de Pipeline (R$)</label>
                                <input type="number" placeholder="0" value={newLead.value} onChange={(e) => setNewLead({...newLead, value: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="p-10 bg-slate-50/50 flex gap-4">
                        <button onClick={handleSaveLead} disabled={isSaving || !newLead.name} className="flex-1 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Sync to Cloud
                        </button>
                    </div>
                </motion.div>
            </div>
        )}

        {isScheduleModalOpen && selectedLead && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-[120] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 text-white rounded-2xl"><Zap size={20} /></div>
                            <div>
                                <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase italic leading-none">Quick Schedule</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.name}</span>
                            </div>
                        </div>
                        <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={24} /></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input type="date" value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                                <input type="time" value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Call</label>
                            <select value={scheduleData.type} onChange={(e) => setScheduleData({...scheduleData, type: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none">
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
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pipeline;
