
import React from 'react';
import { LayoutDashboard, Target, Users, Calendar, CheckSquare, BrainCircuit, Zap, Settings, PhoneCall, Megaphone, BookOpen, Command, ChevronRight, Layout, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Cockpit CEO', icon: <Layout size={20} /> },
    { id: 'okrs', label: 'Estratégia & OKRs', icon: <Target size={20} /> },
    { id: 'pipeline', label: 'CRM & Vendas', icon: <Users size={20} /> },
    { id: 'content', label: 'Content Machine', icon: <Megaphone size={20} /> },
    { id: 'knowledge', label: 'Knowledge Hub', icon: <BookOpen size={20} /> },
    { id: 'calls', label: 'Smart Calls', icon: <PhoneCall size={20} /> },
    { id: 'routine', label: 'Agenda & Rotina', icon: <Calendar size={20} /> },
    { id: 'tasks', label: 'Sprint 1-3-5', icon: <CheckSquare size={20} /> },
    { id: 'ai', label: 'IA Advisor', icon: <BrainCircuit size={20} /> },
  ];

  return (
    <div className="w-72 bg-slate-900 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-2xl border-r border-white/5">
      {/* Brand Header */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-3 text-white mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Command size={22} className="text-white" />
            </div>
            <div>
                <h1 className="font-black text-xl leading-none tracking-tighter">NEXUS <span className="text-blue-500">OS</span></h1>
                <span className="text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase">Executive Intelligence</span>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-4">Command</p>
        {menuItems.slice(0, 3).map((item) => renderMenuItem(item, activeTab, setActiveTab))}
        
        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Operations</p>
        {menuItems.slice(3, 6).map((item) => renderMenuItem(item, activeTab, setActiveTab))}

        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Performance</p>
        {menuItems.slice(6).map((item) => renderMenuItem(item, activeTab, setActiveTab))}
      </nav>

      {/* Footer Area - Connected User */}
      <div className="p-6 space-y-2">
        <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xl ring-2 ring-blue-500/20">CS</div>
             <div className="flex-1 min-w-0">
                 <p className="text-xs font-black text-white truncate">Carlos Silva</p>
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">CEO Founder</p>
             </div>
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );
};

const renderMenuItem = (item: any, activeTab: string, setActiveTab: (id: string) => void) => {
    const isActive = activeTab === item.id;
    return (
        <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative group w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-500 ${
            isActive
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 translate-x-1'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`${isActive ? 'text-white scale-110' : 'text-slate-600 group-hover:text-blue-400 transition-all'}`}>
                    {item.icon}
                </div>
                <span className={`text-xs font-bold tracking-tight ${isActive ? '' : ''}`}>{item.label}</span>
            </div>
            
            {isActive && (
                <div className="absolute left-[-10px] w-1.5 h-6 bg-white rounded-full"></div>
            )}
        </button>
    );
};

export default Sidebar;
