
import React, { useState, useEffect } from 'react';
import { CallLog, Lead } from '../types';
import { Play, Pause, FileText, BrainCircuit, Loader2, Sparkles, ChevronRight, Mic, Calendar, Clock, User, CheckCircle2, Settings, PhoneCall, Plus, X, Save, MessageSquare, Search, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { callLogsService } from '../services/callLogsService';
import { eventsService } from '../services/eventsService';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '../store/useAppStore';

const Calls: React.FC = () => {
  const { callLogs, setCallLogs, removeCallLog, addCallLog, leads } = useAppStore();
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);

  const [newCall, setNewCall] = useState({
      leadName: '',
      leadId: '',
      type: 'Discovery' as CallLog['type'],
      sentiment: 'Neutral' as CallLog['sentiment'],
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  // Mantém a seleção atualizada se a lista mudar externamente
  useEffect(() => {
      if (selectedCall) {
          const stillExists = callLogs.find(l => String(l.id) === String(selectedCall.id));
          if (!stillExists) setSelectedCall(callLogs.length > 0 ? callLogs[0] : null);
      } else if (callLogs.length > 0 && !selectedCall) {
          setSelectedCall(callLogs[0]);
      }
  }, [callLogs, selectedCall]);

  const handleDeleteCall = async () => {
      if (!selectedCall) return;
      
      const idToDelete = selectedCall.id;
      const leadNameToMatch = selectedCall.leadName;
      
      setIsDeleting(true);
      setShowConfirmDelete(false);

      try {
          const { error: callError } = await callLogsService.delete(idToDelete);
          if (callError) throw new Error(callError);

          // Limpeza na agenda (best-effort, sem FK ainda)
          const leadName = leadNameToMatch.trim();
          const allEvents = await eventsService.getAll();
          if (allEvents.data) {
            const matchingEvents = allEvents.data.filter(
              e => e.type === 'call' && e.title.toLowerCase().includes(leadName.toLowerCase())
            );
            await Promise.all(matchingEvents.map(e => eventsService.delete(e.id)));
          }

          removeCallLog(idToDelete);
          setSelectedCall(null);
      } catch (e) {
          console.error("Erro crítico na exclusão:", e);
          alert("Não foi possível excluir o registro. Verifique sua conexão.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleSelectLead = (lead: Lead) => {
      setNewCall(prev => ({ ...prev, leadName: lead.name, leadId: lead.id }));
      setLeadSearch(lead.name);
      setIsLeadDropdownOpen(false);
  };

  const handleSaveManualCall = async () => {
      if (!newCall.leadName) return;
      setIsSaving(true);
      
      try {
          const callPayload = {
              lead_name: newCall.leadName,
              type: newCall.type,
              sentiment: newCall.sentiment,
              transcript_snippet: newCall.notes,
              summary: newCall.notes.substring(0, 100),
              date: `${newCall.date} ${newCall.time}`,
              duration: "Manual",
              status: 'Completed',
              created_at: new Date().toISOString()
          };

          const { data: savedLog, error: callError } = await callLogsService.create({
              leadName: callPayload.lead_name,
              date: callPayload.date,
              duration: callPayload.duration,
              type: callPayload.type as CallLog['type'],
              status: callPayload.status as CallLog['status'],
              sentiment: callPayload.sentiment as CallLog['sentiment'],
              transcriptSnippet: callPayload.transcript_snippet,
              summary: callPayload.summary,
          });
          if (callError) throw new Error(callError);

          const today = new Date();
          const targetDate = new Date(newCall.date);
          const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

          const { data: savedEvent } = await eventsService.create({
              title: `Call: ${newCall.leadName}`,
              start: newCall.time,
              end: "18:00",
              type: 'call',
              attendees: [newCall.leadName],
              dayOffset,
          });

          if (savedLog) addCallLog(savedLog);

          setIsModalOpen(false);
          setNewCall({
              leadName: '',
              leadId: '',
              type: 'Discovery',
              sentiment: 'Neutral',
              notes: '',
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          });
          setLeadSearch('');
      } catch (e) { 
          console.error(e); 
      } finally { 
          setIsSaving(false); 
      }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">SMART CALLS</h2>
          <p className="text-slate-500 font-medium">Histórico e Sincronização de Agenda</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20"
        >
            <Plus size={16} /> Novo Registro
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full flex-1 min-h-0">
        <div className="w-full lg:w-1/3 bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
           <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Sessões</h3>
              <span className="text-[10px] font-black text-slate-300 uppercase">{callLogs.length} Total</span>
           </div>
           <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
              {callLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-300 italic text-sm">Nenhuma call registrada.</div>
              ) : (
                  callLogs.map(call => (
                    <button 
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedCall?.id === call.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-transparent hover:bg-slate-50'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-sm truncate pr-2">{call.leadName}</h4>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                call.sentiment === 'Positive' ? 'bg-emerald-400 text-white' : 
                                call.sentiment === 'Negative' ? 'bg-rose-400 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>{call.sentiment}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-60">
                           <Calendar size={10} />
                           <span className="text-[10px] font-bold uppercase">{call.date}</span>
                        </div>
                    </button>
                  ))
              )}
           </div>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden relative">
            {selectedCall ? (
                <>
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white z-10">
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCall.leadName}</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedCall.date} • {selectedCall.type}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowConfirmDelete(true)}
                                disabled={isDeleting}
                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group border border-transparent hover:border-rose-100"
                            >
                                {isDeleting ? (
                                    <Loader2 size={20} className="animate-spin text-rose-500" />
                                ) : (
                                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showConfirmDelete && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 text-center"
                                    >
                                        <p className="text-[10px] font-black text-slate-900 uppercase mb-3">Confirmar Exclusão?</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">Não</button>
                                            <button onClick={handleDeleteCall} className="flex-1 py-2 text-[10px] font-black uppercase text-white bg-rose-500 rounded-lg hover:bg-rose-600 shadow-lg shadow-rose-200 transition-colors">Sim, Apagar</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[300px] whitespace-pre-wrap text-sm font-medium text-slate-700 leading-relaxed shadow-inner">
                            {selectedCall.transcriptSnippet || "Sem notas disponíveis para esta call."}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <PhoneCall size={64} className="mb-4 opacity-10" />
                    <p className="font-black text-[10px] uppercase tracking-[0.2em]">Selecione uma sessão no histórico</p>
                </div>
            )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
              >
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase italic">Agendar Novo Registro Integrado</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Data do Evento</label>
                              <input type="date" value={newCall.date} onChange={(e) => setNewCall({...newCall, date: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Hora de Início</label>
                              <input type="time" value={newCall.time} onChange={(e) => setNewCall({...newCall, time: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                          </div>
                      </div>

                      <div className="relative">
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Vincular Lead do CRM</label>
                          <div className="relative">
                            <input 
                                type="text" value={leadSearch} onFocus={() => setIsLeadDropdownOpen(true)}
                                onChange={(e) => { setLeadSearch(e.target.value); setIsLeadDropdownOpen(true); }}
                                placeholder="Buscar nome..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          </div>
                          {isLeadDropdownOpen && (
                              <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-40 overflow-y-auto">
                                  {leads.filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase())).map(lead => (
                                      <button key={lead.id} onClick={() => handleSelectLead(lead)} className="w-full text-left px-5 py-3 hover:bg-slate-50 font-bold text-sm border-b border-slate-50 last:border-0">
                                          {lead.name}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>

                      <textarea value={newCall.notes} onChange={(e) => setNewCall({...newCall, notes: e.target.value})} placeholder="Escreva aqui o resumo estratégico da conversa..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl h-32 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                  </div>

                  <div className="p-8 bg-slate-50/50 flex gap-4">
                      <button onClick={handleSaveManualCall} disabled={isSaving} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          {isSaving ? 'Gravando Dados...' : 'Salvar e Sincronizar Agenda'}
                      </button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calls;
