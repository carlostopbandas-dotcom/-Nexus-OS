
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Users, Calendar, CheckSquare, BrainCircuit, PhoneCall, Megaphone, BookOpen, Command, Layout, LogOut, ShoppingBag, Store, ShoppingCart, UserCheck, TrendingUp, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoleGuard } from '@/components/auth/RoleGuard';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Usuário';

  const roleLabel: Record<string, string> = {
    ceo: 'CEO Founder',
    gestor_vcchic: 'Gestor VcChic',
    vendedor_sdr: 'Vendedor / SDR',
    assistente: 'Assistente',
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const item = (path: string, label: string, icon: React.ReactNode) =>
    renderMenuItem({ path, label, icon }, isActive, navigate);

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
      <nav aria-label="Navegação principal" className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">

        {/* Command — CEO only */}
        <RoleGuard roles={['ceo']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-4">Command</p>
          {item('/', 'Cockpit CEO', <Layout size={20} />)}
          {item('/okrs', 'Estratégia & OKRs', <Target size={20} />)}
          {item('/pipeline', 'CRM & Vendas', <Users size={20} />)}
          {item('/clients', 'Clientes Ativos', <UserCheck size={20} />)}
        </RoleGuard>

        {/* OKRs — gestor_vcchic vê somente esta seção de strategy */}
        <RoleGuard roles={['gestor_vcchic']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-4">Estratégia</p>
          {item('/okrs', 'OKRs VcChic', <Target size={20} />)}
        </RoleGuard>

        {/* CRM — vendedor_sdr e assistente */}
        <RoleGuard roles={['vendedor_sdr', 'assistente']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-4">CRM</p>
          {item('/pipeline', 'CRM & Vendas', <Users size={20} />)}
          {item('/clients', 'Clientes Ativos', <UserCheck size={20} />)}
        </RoleGuard>

        {/* Operations */}
        <RoleGuard roles={['ceo', 'vendedor_sdr']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Operations</p>
          <RoleGuard roles={['ceo']}>
            {item('/content', 'Content Machine', <Megaphone size={20} />)}
            {item('/knowledge', 'Knowledge Hub', <BookOpen size={20} />)}
          </RoleGuard>
          {item('/calls', 'Smart Calls', <PhoneCall size={20} />)}
        </RoleGuard>

        {/* Performance */}
        <RoleGuard roles={['ceo', 'assistente']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Performance</p>
          {item('/routine', 'Agenda & Rotina', <Calendar size={20} />)}
          {item('/tasks', 'Sprint 1-3-5', <CheckSquare size={20} />)}
          <RoleGuard roles={['ceo']}>
            {item('/ai', 'IA Advisor', <BrainCircuit size={20} />)}
          </RoleGuard>
        </RoleGuard>

        {/* E-Commerce — CEO e gestor_vcchic */}
        <RoleGuard roles={['ceo', 'gestor_vcchic']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">E-Commerce</p>
          {item('/shopify', 'Moriel Store', <ShoppingBag size={20} />)}
          {item('/vcchic', 'VcChic Store', <Store size={20} />)}
          {item('/sezo', 'Sezo Store', <ShoppingCart size={20} />)}
        </RoleGuard>

        {/* Financeiro — CEO e gestor_vcchic */}
        <RoleGuard roles={['ceo', 'gestor_vcchic']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Financeiro</p>
          {item('/financeiro', 'Dashboard', <TrendingUp size={20} />)}
        </RoleGuard>
        <RoleGuard roles={['ceo']}>
          {item('/financeiro-3d', '3D Digital', <Building2 size={20} />)}
        </RoleGuard>

        {/* Admin — CEO only */}
        <RoleGuard roles={['ceo']}>
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-8">Admin</p>
          {item('/users', 'Usuários', <Users size={20} />)}
        </RoleGuard>

      </nav>

      {/* Footer Area */}
      <div className="p-6 space-y-2">
        <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
            <Avatar size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{displayName}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                {roleLabel[userRole ?? ''] ?? 'Usuário'}
              </p>
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
