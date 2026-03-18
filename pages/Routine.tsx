
import React, { useState, useEffect, useCallback } from 'react';
import { DAILY_ROUTINE } from '../constants';
import { CalendarEvent, ScheduleBlock, Task } from '../types';
import { eventsService } from '../services/eventsService';
import { Clock, User, Phone, Megaphone, Sparkles, Calendar as CalendarIcon, Zap, AlertCircle, Trash2, Loader2, Pencil, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

type BlockStatus = 'past' | 'current' | 'future';

const Routine: React.FC = () => {
  const { events, setEvents, removeEvent, tasks } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'real' | 'ideal'>('real');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Blueprint state
  const [blueprintBlocks, setBlueprintBlocks] = useState<ScheduleBlock[]>(() => {
    try {
      const saved = localStorage.getItem('nexus-blueprint');
      return saved ? JSON.parse(saved) : DAILY_ROUTINE;
    } catch {
      return DAILY_ROUTINE;
    }
  });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ startTime: string; endTime: string; activity: string; type: ScheduleBlock['type'] }>({ startTime: '', endTime: '', activity: '', type: 'Deep Work' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<{ startTime: string; endTime: string; activity: string; type: ScheduleBlock['type'] }>({ startTime: '', endTime: '', activity: '', type: 'Deep Work' });

  const saveBlueprint = (blocks: ScheduleBlock[]) => {
    setBlueprintBlocks(blocks);
    localStorage.setItem('nexus-blueprint', JSON.stringify(blocks));
  };
  const startEdit = (idx: number) => {
    const [start, end] = blueprintBlocks[idx].time.split(' - ');
    setEditForm({ startTime: start, endTime: end, activity: blueprintBlocks[idx].activity, type: blueprintBlocks[idx].type });
    setEditingIdx(idx);
  };
  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...blueprintBlocks];
    updated[editingIdx] = { time: `${editForm.startTime} - ${editForm.endTime}`, activity: editForm.activity, type: editForm.type };
    saveBlueprint(updated);
    setEditingIdx(null);
  };
  const deleteBlock = (idx: number) => saveBlueprint(blueprintBlocks.filter((_, i) => i !== idx));
  const addBlock = () => {
    if (!addForm.activity) return;
    saveBlueprint([...blueprintBlocks, { time: `${addForm.startTime} - ${addForm.endTime}`, activity: addForm.activity, type: addForm.type }]);
    setShowAddForm(false);
    setAddForm({ startTime: '', endTime: '', activity: '', type: 'Deep Work' });
  };
  const resetBlueprint = () => { if (window.confirm('Restaurar o blueprint original?')) saveBlueprint([...DAILY_ROUTINE]); };

  const bigRock = tasks.find(t => t.type === 'Big Rock' && !t.completed);

  // Converte HH:mm para minutos totais no dia
  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  // Verifica se um horário está dentro de um intervalo, lidando com virada de meia-noite
  const isTimeInBlock = (timeStr: string, blockRange: string) => {
    const checkMin = timeToMinutes(timeStr);
    const [startStr, endStr] = blockRange.split(' - ');
    let startMin = timeToMinutes(startStr);
    let endMin = timeToMinutes(endStr);

    // Se o fim for menor que o início (ex: 21:00 - 06:00), o bloco cruza a meia-noite
    if (endMin < startMin) {
        // Se o horário checado for após o início (21:18 >= 21:00) 
        // OU antes do fim do dia seguinte (01:00 <= 06:00)
        return checkMin >= startMin || checkMin < endMin;
    }
    
    return checkMin >= startMin && checkMin < endMin;
  };

  useEffect(() => {
    eventsService.getAll().then(({ data }) => {
      if (data) setEvents(data);
    });
  }, [setEvents]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleDeleteEvent = async (id: string) => {
      const previousEvents = [...events];
      removeEvent(id);
      setDeletingId(id);

      const { error } = await eventsService.delete(id);
      if (error) {
          console.error("Erro ao deletar:", error);
          setEvents(previousEvents);
          alert("Erro ao remover compromisso.");
      }
      setDeletingId(null);
  };

  const getDayOffset = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const selectedOffset = getDayOffset(selectedDate);
  const dayEvents = events.filter(e => e.dayOffset === selectedOffset);

  const getBlockStatus = (timeRange: string): BlockStatus => {
    if (selectedOffset < 0) return 'past';
    if (selectedOffset > 0) return 'future';
    
    const nowStr = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (isTimeInBlock(nowStr, timeRange)) return 'current';
    
    const [startStr] = timeRange.split(' - ');
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    if (nowMinutes > timeToMinutes(startStr)) return 'past';
    return 'future';
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Compromissos que não se encaixam em NENHUM bloco da rotina
  const unassigned = dayEvents.filter(ev => {
      return !blueprintBlocks.some(block => isTimeInBlock(ev.start, block.time));
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">NEXUS CALENDAR</h2>
          <p className="text-slate-500 font-medium">Controle de Operações: Agenda Integrada</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button onClick={() => setViewMode('real')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'real' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Agenda Integrada</button>
            <button onClick={() => setViewMode('ideal')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'ideal' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Blueprint</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
                {weekDays.map((day, idx) => {
                    const isSelected = selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth();
                    const isToday = new Date().getDate() === day.getDate();
                    return (
                        <button key={idx} onClick={() => setSelectedDate(day)}
                            className={`flex flex-col items-center min-w-[65px] p-3 rounded-2xl transition-all ${
                                isSelected ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'
                            }`}
                        >
                            <span className="text-[9px] font-black uppercase mb-1">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            <span className="text-lg font-black">{day.getDate()}</span>
                            {isToday && !isSelected && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 animate-pulse"></div>}
                        </button>
                    );
                })}
            </div>
            <div className="text-right">
                <p className="text-lg font-black text-slate-900 tracking-tight capitalize">{selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
                
                {viewMode === 'real' && unassigned.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-amber-50/50 border border-amber-200/50 rounded-[2rem] p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-amber-600 mb-6">
                            <AlertCircle size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Compromissos Fora da Rotina</span>
                        </div>
                        <div className="space-y-3">
                            {unassigned.map(ev => (
                                <div key={ev.id} className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex justify-between items-center group hover:border-amber-300 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20"><Phone size={16}/></div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{ev.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock size={12} className="text-slate-300" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ev.start}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteEvent(ev.id)}
                                        className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        {deletingId === ev.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {viewMode === 'ideal' && (
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rotina Ideal · {blueprintBlocks.length} blocos</p>
                        <button onClick={resetBlueprint} className="text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-all">Restaurar Padrão</button>
                    </div>
                )}

                {blueprintBlocks.map((block, idx) => {
                    const status = getBlockStatus(block.time);
                    const eventsInThisBlock = dayEvents.filter(ev => isTimeInBlock(ev.start, block.time));

                    return (
                        <div key={idx} className={`relative pl-10 border-l-2 pb-10 last:border-l-0 ${status === 'past' ? 'border-slate-100' : 'border-slate-200'}`}>
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white z-10 ${
                                status === 'current' ? 'bg-blue-600 ring-4 ring-blue-100' :
                                status === 'past' ? 'bg-slate-300' : 'bg-slate-100'
                            }`}></div>

                            {viewMode === 'ideal' && editingIdx === idx ? (
                                <div className="flex items-center gap-2 mb-5 flex-wrap">
                                    <input type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} className="text-xs font-mono font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400" />
                                    <span className="text-slate-300 font-bold text-xs">–</span>
                                    <input type="time" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} className="text-xs font-mono font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400" />
                                    <input type="text" value={editForm.activity} onChange={e => setEditForm(f => ({ ...f, activity: e.target.value }))} className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400 flex-1 min-w-[140px]" placeholder="Atividade" />
                                    <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as ScheduleBlock['type'] }))} className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400">
                                        {(['Deep Work', 'Health', 'Meeting', 'Rest', 'Learning'] as const).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <button onClick={saveEdit} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md"><Check size={14} /></button>
                                    <button onClick={() => setEditingIdx(null)} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-all"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 mb-5">
                                    <span className={`text-sm font-black font-mono ${status === 'current' ? 'text-blue-600' : 'text-slate-400'}`}>{block.time}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                                        status === 'current' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'
                                    }`}>{block.activity}</span>
                                    {viewMode === 'ideal' && (
                                        <div className="ml-auto flex items-center gap-1">
                                            <button onClick={() => startEdit(idx)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={14} /></button>
                                            <button onClick={() => deleteBlock(idx)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {viewMode === 'real' && (
                                <div className="space-y-3">
                                    {eventsInThisBlock.map(ev => (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={ev.id} 
                                            className={`p-5 rounded-2xl border shadow-lg group relative transition-all hover:scale-[1.01] ${ev.type === 'call' ? 'bg-teal-50 border-teal-200' : 'bg-white border-blue-200'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl shadow-md ${ev.type === 'call' ? 'bg-teal-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                        {ev.type === 'call' ? <Phone size={18} /> : <CalendarIcon size={18} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm">{ev.title}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                            <Clock size={12} /> Início: {ev.start}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteEvent(ev.id)}
                                                    className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    {deletingId === ev.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {status === 'current' && block.type === 'Deep Work' && eventsInThisBlock.length === 0 && bigRock && (
                                        <div className="bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-100 border-dashed animate-pulse">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 flex items-center gap-1.5"><Sparkles size={12}/> Foco Estratégico Sugerido</p>
                                            <p className="text-sm font-bold text-slate-700">{bigRock.title}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {viewMode === 'ideal' && (
                    <div className="pt-2 space-y-3">
                        {showAddForm ? (
                            <div className="bg-white border border-blue-100 rounded-2xl p-5 flex items-center gap-2 flex-wrap shadow-sm">
                                <input type="time" value={addForm.startTime} onChange={e => setAddForm(f => ({ ...f, startTime: e.target.value }))} className="text-xs font-mono font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400" />
                                <span className="text-slate-300 font-bold text-xs">–</span>
                                <input type="time" value={addForm.endTime} onChange={e => setAddForm(f => ({ ...f, endTime: e.target.value }))} className="text-xs font-mono font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400" />
                                <input type="text" value={addForm.activity} onChange={e => setAddForm(f => ({ ...f, activity: e.target.value }))} className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400 flex-1 min-w-[140px]" placeholder="Nome da atividade" />
                                <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value as ScheduleBlock['type'] }))} className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400">
                                    {(['Deep Work', 'Health', 'Meeting', 'Rest', 'Learning'] as const).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <button onClick={addBlock} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md"><Check size={14} /></button>
                                <button onClick={() => setShowAddForm(false)} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-all"><X size={14} /></button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all text-xs font-black uppercase tracking-widest">
                                <Plus size={16} /> Adicionar Bloco
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Routine;
