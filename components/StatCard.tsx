
import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  subtext?: string;
  status: 'good' | 'warning' | 'critical';
  secondaryValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, subtext, status, secondaryValue }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'good': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', accent: 'bg-emerald-500' };
      case 'warning': return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', accent: 'bg-amber-500' };
      case 'critical': return { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', accent: 'bg-rose-500' };
      default: return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', accent: 'bg-blue-500' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="group relative bg-white border border-slate-200 rounded-[2rem] p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${config.bg} blur-[60px] rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150`}></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
            {secondaryValue && <p className="text-[10px] font-bold text-slate-300 italic">{secondaryValue}</p>}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${config.color} ${config.bg} border ${config.border}`}>
             {change > 0 ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />} 
             <span>{Math.abs(change)}%</span>
          </div>
        </div>
        
        <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{value}</span>
            {subtext && (
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className={config.color} />
                    {subtext}
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
