
import React from 'react';
import { OKR } from '../types';
import { CheckCircle2, Circle, Target, TrendingUp, Sparkles, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface OkrsProps {
    okrs: OKR[];
    setOkrs: React.Dispatch<React.SetStateAction<OKR[]>>;
}

const getUnitConfig = (unit: string) => {
    if (unit === '3D Digital') return { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700', accent: 'bg-blue-600', ring: 'ring-blue-100' };
    if (unit === 'Grupo VcChic') return { color: 'pink', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', badge: 'bg-pink-100 text-pink-700', accent: 'bg-pink-600', ring: 'ring-pink-100' };
    if (unit === 'VcChic') return { color: 'pink', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', badge: 'bg-pink-50 text-pink-600', accent: 'bg-pink-500', ring: 'ring-pink-100' };
    if (unit === 'Mivave') return { color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700', accent: 'bg-purple-600', ring: 'ring-purple-100' };
    if (unit === 'Sezo') return { color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700', accent: 'bg-orange-600', ring: 'ring-orange-100' };
    if (unit === 'Moriel') return { color: 'teal', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', badge: 'bg-teal-100 text-teal-700', accent: 'bg-teal-600', ring: 'ring-teal-100' };
    return { color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-600', ring: 'ring-emerald-100' };
};

const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-emerald-500';
    if (progress >= 40) return 'bg-amber-400';
    return 'bg-rose-400';
};

const getProgressLabel = (progress: number) => {
    if (progress >= 90) return { label: 'Quase lá', style: 'text-emerald-600 bg-emerald-50' };
    if (progress >= 70) return { label: 'No ritmo', style: 'text-emerald-600 bg-emerald-50' };
    if (progress >= 40) return { label: 'Atenção', style: 'text-amber-600 bg-amber-50' };
    return { label: 'Em risco', style: 'text-rose-600 bg-rose-50' };
};

const Okrs: React.FC<OkrsProps> = ({ okrs, setOkrs }) => {

  const toggleKeyResult = async (okrId: string, resultIndex: number) => {
    const updatedOkrs = okrs.map(okr => {
      if (okr.id !== okrId) return okr;
      const newResults = [...okr.keyResults];
      newResults[resultIndex].completed = !newResults[resultIndex].completed;

      const completedCount = newResults.filter(r => r.completed).length;
      const newProgress = Math.round((completedCount / newResults.length) * 100);

      return { ...okr, keyResults: newResults, progress: newProgress };
    });

    setOkrs(updatedOkrs);

    const targetOkr = updatedOkrs.find(o => o.id === okrId);
    if (targetOkr) {
        await supabase.from('okrs').update({
            key_results: targetOkr.keyResults,
            progress: targetOkr.progress
        }).eq('id', okrId);
    }
  };

  const totalProgress = okrs.length > 0
    ? Math.round(okrs.reduce((acc, o) => acc + o.progress, 0) / okrs.length)
    : 0;

  const totalKRs = okrs.reduce((acc, o) => acc + o.keyResults.length, 0);
  const completedKRs = okrs.reduce((acc, o) => acc + o.keyResults.filter(kr => kr.completed).length, 0);

  if (okrs.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
              <Target size={64} className="mb-4 opacity-10" />
              <p className="font-black text-[10px] uppercase tracking-[0.2em]">Nenhum OKR definido no Banco de Dados</p>
          </div>
      )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></div>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Strategic Command</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">OKRs <span className="text-blue-600">2026</span></h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Alinhamento de Visão e Execução Trimestral</p>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
              <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progresso Global</span>
                  <span className="text-2xl font-black text-slate-900">{totalProgress}%</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-100"></div>
              <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Key Results</span>
                  <span className="text-2xl font-black text-emerald-600">{completedKRs}<span className="text-slate-300 text-sm">/{totalKRs}</span></span>
              </div>
          </div>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg"><Layers size={18} /></div>
                  <div>
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Progresso Consolidado</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Todos os objetivos estratégicos</span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{okrs.length} Objetivos Ativos</span>
              </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-3 rounded-full ${getProgressColor(totalProgress)} shadow-sm`}
              />
          </div>
          <div className="flex justify-between mt-3">
              <span className="text-[9px] font-black text-slate-400 uppercase">0%</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">Meta: 100%</span>
          </div>
      </div>

      {/* OKR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {okrs.map((okr, idx) => {
          const config = getUnitConfig(okr.unit);
          const progressInfo = getProgressLabel(okr.progress);
          const completedCount = okr.keyResults.filter(kr => kr.completed).length;

          return (
            <motion.div
                key={okr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="p-8 pb-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${config.accent} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                          <Target size={20} />
                      </div>
                      <div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${config.badge}`}>
                            {okr.unit}
                          </span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">{okr.progress}%</span>
                      <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${progressInfo.style}`}>
                          {progressInfo.label}
                      </div>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-4">{okr.objective}</h3>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${okr.progress}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.15 }}
                      className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(okr.progress)}`}
                  />
                </div>
                <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-slate-300">{completedCount} de {okr.keyResults.length} concluídos</span>
                    <span className="text-[9px] font-bold text-slate-300 flex items-center gap-1">
                        <TrendingUp size={10} />
                        Q1 2026
                    </span>
                </div>
              </div>

              {/* Key Results */}
              <div className="px-8 pb-8">
                <div className="space-y-3">
                  {okr.keyResults.map((kr, krIdx) => (
                    <motion.button
                      key={krIdx}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group/kr ${
                        kr.completed
                            ? 'bg-slate-50/50 border-slate-100'
                            : `${config.bg} ${config.border} hover:shadow-md`
                      }`}
                      onClick={() => toggleKeyResult(okr.id, krIdx)}
                    >
                      <div className={`mt-0.5 flex-shrink-0 transition-all ${
                        kr.completed
                            ? 'text-emerald-500'
                            : `text-slate-300 group-hover/kr:${config.text}`
                      }`}>
                        {kr.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </div>
                      <span className={`text-sm font-bold leading-relaxed ${
                        kr.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-700'
                      }`}>
                        {kr.text}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Okrs;
