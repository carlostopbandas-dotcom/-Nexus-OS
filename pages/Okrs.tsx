
import React from 'react';
import { OKR } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OkrsProps {
    okrs: OKR[];
    setOkrs: React.Dispatch<React.SetStateAction<OKR[]>>;
}

const Okrs: React.FC<OkrsProps> = ({ okrs, setOkrs }) => {
  
  const toggleKeyResult = async (okrId: string, resultIndex: number) => {
    // 1. Optimistic Update Local State
    const updatedOkrs = okrs.map(okr => {
      if (okr.id !== okrId) return okr;
      const newResults = [...okr.keyResults];
      newResults[resultIndex].completed = !newResults[resultIndex].completed;
      
      // Recalc Progress
      const completedCount = newResults.filter(r => r.completed).length;
      const newProgress = Math.round((completedCount / newResults.length) * 100);

      return { ...okr, keyResults: newResults, progress: newProgress };
    });

    setOkrs(updatedOkrs);

    // 2. Persist to Supabase
    const targetOkr = updatedOkrs.find(o => o.id === okrId);
    if (targetOkr) {
        await supabase.from('okrs').update({
            key_results: targetOkr.keyResults,
            progress: targetOkr.progress
        }).eq('id', okrId);
    }
  };

  const getUnitBadgeStyle = (unit: string) => {
      if (unit === '3D Digital') return 'bg-blue-100 text-blue-700';
      if (unit === 'Grupo VcChic') return 'bg-pink-100 text-pink-700';
      if (unit === 'VcChic') return 'bg-pink-50 text-pink-600 border border-pink-200';
      if (unit === 'Mivave') return 'bg-purple-100 text-purple-700';
      if (unit === 'Sezo') return 'bg-orange-100 text-orange-700';
      if (unit === 'Moriel') return 'bg-teal-100 text-teal-700';
      return 'bg-green-100 text-green-700'; // Personal
  };

  if (okrs.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
              <p>Nenhum OKR definido no Banco de Dados.</p>
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Objetivos Estratégicos 2026</h2>
        <p className="text-slate-500">Acompanhamento trimestral e alinhamento de visão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {okrs.map((okr) => (
          <div key={okr.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${getUnitBadgeStyle(okr.unit)}`}>
                  {okr.unit}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{okr.objective}</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900">{okr.progress}%</span>
                <p className="text-xs text-slate-400">Progresso</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    okr.progress >= 70 ? 'bg-green-500' : 
                    okr.progress >= 40 ? 'bg-amber-400' : 'bg-red-400'
                  }`} 
                  style={{ width: `${okr.progress}%` }}
                ></div>
              </div>

              <ul className="space-y-4">
                {okr.keyResults.map((kr, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => toggleKeyResult(okr.id, idx)}
                  >
                    <div className={`mt-0.5 ${kr.completed ? 'text-green-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {kr.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <span className={`text-sm ${kr.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {kr.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Okrs;
