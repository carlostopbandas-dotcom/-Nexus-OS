
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Users, Calendar, CheckSquare, BrainCircuit, PhoneCall, Megaphone, BookOpen, Command, Layout, LogOut, ShoppingBag, Store, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { path: '/',          label: 'Cockpit CEO',        icon: <Layout size={20} /> },
  { path: '/okrs',      label: 'Estratégia & OKRs',  icon: <Target size={20} /> },
  { path: '/pipeline',  label: 'CRM & Vendas',        icon: <Users size={20} /> },
  { path: '/content',   label: 'Content Machine',     icon: <Megaphone size={20} /> },
  { path: '/knowledge', label: 'Knowledge Hub',       icon: <BookOpen size={20} /> },
  { path: '/calls',     label: 'Smart Calls',         icon: <PhoneCall size={20} /> },
  { path: '/routine',   label: 'Agenda & Rotina',     icon: <Calendar size={20} /> },
  { path: '/tasks',     label: 'Sprint 1-3-5',        icon: <CheckSquare size={20} /> },
  { path: '/ai',        label: 'IA Advisor',          icon: <BrainCircuit size={20} /> },
];

const storeItems = [
  { path: '/shopify', label: 'Grupo VcChic',  icon: <ShoppingBag size={20} /> },
  { path: '/vcchic',  label: 'VcChic Store',  icon: <Store size={20} /> },
  { path: '/sezo',    label: 'Sezo Store',    icon: <ShoppingCart size={20} /> },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

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
        {menuItems.slice(0, 3).map((item) => renderMenuItem(item, isActive, navigate))}

        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Operations</p>
        {menuItems.slice(3, 6).map((item) => renderMenuItem(item, isActive, navigate))}

        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Performance</p>
        {menuItems.slice(6).map((item) => renderMenuItem(item, isActive, navigate))}

        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">E-Commerce</p>
        {storeItems.map((item) => renderMenuItem(item, isActive, navigate))}
      </nav>

      {/* Footer Area */}
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

const renderMenuItem = (
  item: { path: string; label: string; icon: React.ReactNode },
  isActive: (path: string) => boolean,
  navigate: (path: string) => void
) => {
  const active = isActive(item.path);
  return (
    <button
      key={item.path}
      onClick={() => navigate(item.path)}
      className={`relative group w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-500 ${
        active
          ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 translate-x-1'
          : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`${active ? 'text-white scale-110' : 'text-slate-600 group-hover:text-blue-400 transition-all'}`}>
          {item.icon}
        </div>
        <span className="text-xs font-bold tracking-tight">{item.label}</span>
      </div>
      {active && (
        <div className="absolute left-[-10px] w-1.5 h-6 bg-white rounded-full"></div>
      )}
    </button>
  );
};

export default Sidebar;
