

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { storeMetricsService } from '../services/storeMetricsService';
import { shopifyService, ShopifyOrder } from '../services/shopifyService';
import {
  Store, Calculator, Loader2, Zap, Check, TrendingUp, Target, Globe,
  ArrowRight, Bell, Sparkles, ChevronRight, ShoppingBag, RefreshCw,
  DollarSign, Package
} from 'lucide-react';
import { LeadStatus, StoreMetric } from '../types';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';

type MainUnit = 'Overview' | '3D Digital' | 'Grupo VcChic';


interface StoreStats {
  name: string;
  mtdSales: number;
  todaySales: number;
  mtdSpend: number;
  todaySpend: number;
  roas: number;
  color: string;
  bg: string;
  isMain: boolean;
  isLive?: boolean;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, leads, events, storeMetrics, ytdStoreMetrics, addStoreMetric, fetchAll, loading: isLoading } = useAppStore();
  const [activeUnit, setActiveUnit] = useState<MainUnit>('Overview');
  const [isSavingMetric, setIsSavingMetric] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newMetric, setNewMetric] = useState({
    store_name: 'vcchic',
    sales: '',
    spend: '',
    date: new Date().toLocaleDateString('en-CA'),
  });

  // ── Shopify live state ────────────────────────────────────────────────────
  const [morielOrders, setMorielOrders] = useState<ShopifyOrder[]>([]);
  const [morielLoading, setMorielLoading] = useState(false);
  const [morielLastSync, setMorielLastSync] = useState<Date | null>(null);

  const [vcchicOrders, setVcchicOrders] = useState<ShopifyOrder[]>([]);
  const [vcchicLoading, setVcchicLoading] = useState(false);
  const [vcchicLastSync, setVcchicLastSync] = useState<Date | null>(null);

  const [sezoOrders, setSezoOrders] = useState<ShopifyOrder[]>([]);
  const [sezoLoading, setSezoLoading] = useState(false);
  const [sezoLastSync, setSezoLastSync] = useState<Date | null>(null);

  const loadMorielOrders = useCallback(async () => {
    setMorielLoading(true);
    const { data } = await shopifyService.getLiveOrders('moriel');
    setMorielOrders(data);
    setMorielLastSync(new Date());
    setMorielLoading(false);
  }, []);

  const loadVcchicOrders = useCallback(async () => {
    setVcchicLoading(true);
    const { data } = await shopifyService.getLiveOrders('vcchic');
    setVcchicOrders(data);
    setVcchicLastSync(new Date());
    setVcchicLoading(false);
  }, []);

  const loadSezoOrders = useCallback(async () => {
    setSezoLoading(true);
    const { data } = await shopifyService.getLiveOrders('sezo');
    setSezoOrders(data);
    setSezoLastSync(new Date());
    setSezoLoading(false);
  }, []);

  // ── YTD Shopify state ────────────────────────────────────────────────────
  const [vcchicYtdOrders, setVcchicYtdOrders] = useState<ShopifyOrder[]>([]);
  const [sezoYtdOrders, setSezoYtdOrders] = useState<ShopifyOrder[]>([]);
  const [morielYtdOrders, setMorielYtdOrders] = useState<ShopifyOrder[]>([]);

  const loadVcchicYtdOrders = useCallback(async () => {
    const { data } = await shopifyService.getYtdOrders('vcchic');
    setVcchicYtdOrders(data);
  }, []);

  const loadSezoYtdOrders = useCallback(async () => {
    const { data } = await shopifyService.getYtdOrders('sezo');
    setSezoYtdOrders(data);
  }, []);

  const loadMorielYtdOrders = useCallback(async () => {
    const { data } = await shopifyService.getYtdOrders('moriel');
    setMorielYtdOrders(data);
  }, []);

  useEffect(() => {
    loadMorielOrders();
    loadVcchicOrders();
    loadSezoOrders();
    // YTD: carrega uma vez na montagem (não precisa de polling frequente)
    loadVcchicYtdOrders();
    loadSezoYtdOrders();
    loadMorielYtdOrders();
    const interval = setInterval(() => {
      loadMorielOrders();
      loadVcchicOrders();
      loadSezoOrders();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadMorielOrders, loadVcchicOrders, loadSezoOrders, loadVcchicYtdOrders, loadSezoYtdOrders, loadMorielYtdOrders]);

  // Data processing for Grupo VcChic
  const performanceData = useMemo<Record<string, StoreStats>>(() => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = `${monthStr}-${String(now.getDate()).padStart(2, '0')}`;
    const liveStores = new Set(['vcchic', 'sezo', 'moriel']);

    const stores: Record<string, StoreStats> = {
      vcchic: { name: 'VcChic', mtdSales: 0, todaySales: 0, mtdSpend: 0, todaySpend: 0, roas: 0, color: 'text-blue-600', bg: 'bg-blue-50', isMain: true,  isLive: true  },
      mivave: { name: 'Mivave', mtdSales: 0, todaySales: 0, mtdSpend: 0, todaySpend: 0, roas: 0, color: 'text-purple-600', bg: 'bg-purple-50', isMain: false, isLive: false },
      sezo:   { name: 'Sezo',   mtdSales: 0, todaySales: 0, mtdSpend: 0, todaySpend: 0, roas: 0, color: 'text-orange-600', bg: 'bg-orange-50', isMain: false, isLive: true  },
      moriel: { name: 'Moriel', mtdSales: 0, todaySales: 0, mtdSpend: 0, todaySpend: 0, roas: 0, color: 'text-teal-600', bg: 'bg-teal-50', isMain: false, isLive: true  }
    };

    // Supabase: somente gasto de ads (spend) para todas as lojas
    storeMetrics.forEach(m => {
      const storeKey = m.store_name.trim().toLowerCase();
      const store = stores[storeKey];
      if (!store) return;
      const spVal = Number(m.spend) || 0;
      store.mtdSpend += spVal;
      if (m.date.split('T')[0] === todayStr) store.todaySpend += spVal;
      if (!liveStores.has(storeKey)) {
        const sVal = Number(m.sales) || 0;
        store.mtdSales += sVal;
        if (m.date.split('T')[0] === todayStr) store.todaySales += sVal;
      }
    });

    // Shopify live: substitui vendas com dados reais
    const vcchicPaid = vcchicOrders.filter(o => o.financial_status === 'paid');
    stores.vcchic.mtdSales   = vcchicPaid.filter(o => o.created_at.slice(0, 7) === monthStr).reduce((a, o) => a + parseFloat(o.total_price), 0);
    stores.vcchic.todaySales = vcchicPaid.filter(o => o.created_at.slice(0, 10) === todayStr).reduce((a, o) => a + parseFloat(o.total_price), 0);

    const sezoPaid = sezoOrders.filter(o => o.financial_status === 'paid');
    stores.sezo.mtdSales   = sezoPaid.filter(o => o.created_at.slice(0, 7) === monthStr).reduce((a, o) => a + parseFloat(o.total_price), 0);
    stores.sezo.todaySales = sezoPaid.filter(o => o.created_at.slice(0, 10) === todayStr).reduce((a, o) => a + parseFloat(o.total_price), 0);

    const morielPaid = morielOrders.filter(o => o.financial_status === 'paid');
    stores.moriel.mtdSales   = morielPaid.filter(o => o.created_at.slice(0, 7) === monthStr).reduce((a, o) => a + parseFloat(o.total_price), 0);
    stores.moriel.todaySales = morielPaid.filter(o => o.created_at.slice(0, 10) === todayStr).reduce((a, o) => a + parseFloat(o.total_price), 0);

    Object.values(stores).forEach((s: StoreStats) => {
      s.roas = s.mtdSpend > 0 ? s.mtdSales / s.mtdSpend : 0;
    });
    return stores;
  }, [storeMetrics, vcchicOrders, sezoOrders, morielOrders]);

  // ── Faturamento Acumulado do Ano (YTD) ───────────────────────────────────
  const ytdSales = useMemo(() => {
    const yearStr = String(new Date().getFullYear());

    const mivaveYtd = (ytdStoreMetrics as StoreMetric[])
      .filter(m => m.store_name.trim().toLowerCase() === 'mivave')
      .reduce((acc, m) => acc + (Number(m.sales) || 0), 0);

    const vcchicYtd = vcchicYtdOrders
      .filter(o => o.financial_status === 'paid' && o.created_at.startsWith(yearStr))
      .reduce((acc, o) => acc + parseFloat(o.total_price), 0);

    const sezoYtd = sezoYtdOrders
      .filter(o => o.financial_status === 'paid' && o.created_at.startsWith(yearStr))
      .reduce((acc, o) => acc + parseFloat(o.total_price), 0);

    const morielYtd = morielYtdOrders
      .filter(o => o.financial_status === 'paid' && o.created_at.startsWith(yearStr))
      .reduce((acc, o) => acc + parseFloat(o.total_price), 0);

    const digital3dYtd = leads
      .filter(l => ['Nexus', 'Mapa da Clareza', 'Formação 3D'].includes(l.product) && l.status === LeadStatus.WON && l.createdAt?.startsWith(yearStr))
      .reduce((acc, l) => acc + l.value, 0);

    return {
      ecommerce: mivaveYtd + vcchicYtd + sezoYtd + morielYtd,
      digital: digital3dYtd,
      total: mivaveYtd + vcchicYtd + sezoYtd + morielYtd + digital3dYtd,
    };
  }, [ytdStoreMetrics, vcchicYtdOrders, sezoYtdOrders, morielYtdOrders, leads]);

  // Derived Values
  const totalMtdSales = (Object.values(performanceData) as StoreStats[]).reduce((acc: number, curr: StoreStats) => acc + curr.mtdSales, 0);
  const totalMtdSpend = (Object.values(performanceData) as StoreStats[]).reduce((acc: number, curr: StoreStats) => acc + curr.mtdSpend, 0);
  const globalMtdRoas = totalMtdSpend > 0 ? totalMtdSales / totalMtdSpend : 0;

  const leads3D = leads.filter(l => ['Nexus', 'Mapa da Clareza', 'Formação 3D'].includes(l.product));
  const revenue3D = leads3D.filter(l => l.status === LeadStatus.WON).reduce((acc, curr) => acc + curr.value, 0);
  const pipeline3D = leads3D.reduce((acc, l) => acc + l.value, 0);
  const conversion3D = leads3D.length > 0
    ? parseFloat(((leads3D.filter(l => l.status === LeadStatus.WON).length / leads3D.length) * 100).toFixed(1))
    : 0;

  // Dynamic Stat Calculations based on Command Selection
  const activeStats = useMemo(() => {
    if (activeUnit === 'Overview') {
      return { revenue: revenue3D + totalMtdSales, roas: globalMtdRoas, pipe: pipeline3D, conversion: 12.4 };
    } else if (activeUnit === '3D Digital') {
      return { revenue: revenue3D, roas: 3.12, pipe: pipeline3D, conversion: conversion3D };
    } else {
      return { revenue: totalMtdSales, roas: globalMtdRoas, pipe: totalMtdSpend, conversion: 4.8 };
    }
  }, [activeUnit, revenue3D, totalMtdSales, globalMtdRoas, pipeline3D, totalMtdSpend, conversion3D]);

  const loadingByStore: Record<string, boolean> = {
    vcchic: vcchicLoading,
    sezo: sezoLoading,
    moriel: morielLoading,
  };

  const handleSaveMetric = async () => {
    const isLiveStore = ['vcchic', 'sezo', 'moriel'].includes(newMetric.store_name);
    const sales = isLiveStore ? 0 : parseFloat(newMetric.sales);
    const spend = parseFloat(newMetric.spend);
    if ((!isLiveStore && isNaN(sales)) || isNaN(spend)) return;
    setIsSavingMetric(true);
    try {
      const payload = { store_name: newMetric.store_name, sales, spend, roas: spend > 0 ? sales / spend : 0, date: newMetric.date };
      const { data, error } = await storeMetricsService.create(payload);
      if (error) throw new Error(error);
      if (data) addStoreMetric(data);
      setNewMetric({ ...newMetric, sales: '', spend: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { toast.error('Erro ao sincronizar.'); } finally { setIsSavingMetric(false); }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header — saudação dinâmica */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Executive Cockpit v2.0 · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">{getGreeting()}, <span className="text-blue-600">Carlos.</span></h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Consolidação de Dados: 3D Digital & VcChic</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white shadow-xl shadow-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-100">
            {(['Overview', '3D Digital', 'Grupo VcChic'] as MainUnit[]).map((unit) => (
              <button
                key={unit}
                onClick={() => setActiveUnit(unit)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeUnit === unit ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
          <button onClick={() => fetchAll()} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:shadow-2xl transition-all shadow-sm">
            <Zap size={20} className={isLoading ? 'animate-pulse text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Global ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={activeUnit === 'Grupo VcChic' ? 'Vendas Grupo' : 'Faturamento Bruto'}
          value={`R$ ${fmt(activeStats.revenue)}`}
          change={18.4} status="good"
          secondaryValue={activeUnit === 'Overview' ? 'Consolidado' : activeUnit}
          subtext="Performance Financeira"
        />
        <StatCard
          title="ROAS Médio"
          value={`${activeStats.roas.toFixed(2)}x`}
          change={5.2}
          status={activeStats.roas >= 2.5 ? 'good' : 'warning'}
          subtext="Retorno sobre Ads"
        />
        <StatCard
          title={activeUnit === 'Grupo VcChic' ? 'Gasto Ads Total' : 'Pipeline Ativo'}
          value={activeUnit === 'Grupo VcChic' ? `R$ ${fmt(totalMtdSpend)}` : `R$ ${fmt(activeStats.pipe)}`}
          change={-2.1} status="warning"
          subtext={activeUnit === 'Grupo VcChic' ? 'Investimento Marketing' : 'Contratos em Aberto'}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${activeStats.conversion}%`}
          change={0.4} status="good"
          subtext="Eficiência de Vendas"
        />
      </div>

      {/* ── YTD Acumulado ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <TrendingUp size={22} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Faturamento Acumulado {new Date().getFullYear()}</p>
            <p className="text-4xl font-black text-white tracking-tighter">R$ {fmt(ytdSales.total)}</p>
          </div>
        </div>
        <div className="flex gap-8 ml-1 md:ml-0">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">E-commerce</p>
            <p className="text-xl font-black text-slate-200">R$ {fmt(ytdSales.ecommerce)}</p>
          </div>
          <div className="w-px bg-slate-700 hidden md:block"></div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">3D Digital</p>
            <p className="text-xl font-black text-slate-200">R$ {fmt(ytdSales.digital)}</p>
          </div>
        </div>
      </div>

      {/* ── Painéis condicionais ───────────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* OVERVIEW */}
        {activeUnit === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Globe size={120} /></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200"><Target size={24} /></div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">3D Digital</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Educação & Serviços</p>
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Faturamento</span>
                    <span className="text-2xl font-black text-slate-900">R$ {revenue3D.toLocaleString()}</span>
                  </div>
                  <button onClick={() => setActiveUnit('3D Digital')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-indigo-600 hover:text-white transition-all group">
                    Detalhar Operação <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Store size={120} /></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-pink-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-pink-200"><Store size={24} /></div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Grupo VcChic</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retail & Dropshipping</p>
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Vendas Mês</span>
                    <span className="text-2xl font-black text-slate-900">R$ {fmt(totalMtdSales)}</span>
                  </div>
                  {/* Mini resumo das lojas no Overview */}
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(performanceData) as [string, StoreStats][]).map(([key, s]) => (
                      <div key={key} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black uppercase ${s.color}`}>{s.name}</span>
                          {s.isLive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-700">R$ {s.mtdSales.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveUnit('Grupo VcChic')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-pink-600 hover:text-white transition-all group">
                    Abrir Grupo <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3"><Bell size={18} className="text-blue-400" /> Nexus Pulse</h3>
                <Sparkles size={16} className="text-blue-400 animate-pulse" />
              </div>
              <div className="space-y-5 h-[300px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {tasks.filter(t => t.type === 'Big Rock' && !t.completed).length > 0 && (
                  <div className="border-l-2 border-red-500/50 pl-4 py-1">
                    <p className="text-[10px] font-black text-red-400 uppercase mb-1">Foco do Dia</p>
                    <p className="text-xs font-bold leading-relaxed text-slate-300">{tasks.find(t => t.type === 'Big Rock' && !t.completed)?.title}</p>
                  </div>
                )}
                {events.filter(e => e.dayOffset === 0).length > 0 && (
                  <div className="border-l-2 border-blue-500/30 pl-4 py-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Agenda Hoje</p>
                    <p className="text-xs font-bold leading-relaxed text-slate-300">{events.filter(e => e.dayOffset === 0).length} compromissos agendados</p>
                    {events.filter(e => e.dayOffset === 0).slice(0, 2).map(ev => (
                      <p key={ev.id} className="text-[10px] font-bold text-slate-500 mt-1">{ev.start} — {ev.title}</p>
                    ))}
                  </div>
                )}
                <div className="border-l-2 border-emerald-500/30 pl-4 py-1">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Pipeline</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-300">{leads.length} leads ativos • R$ {leads.reduce((a, l) => a + l.value, 0).toLocaleString()} em pipe</p>
                </div>
                <div className="border-l-2 border-amber-500/30 pl-4 py-1">
                  <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Tarefas</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-300">{tasks.filter(t => !t.completed).length} pendentes de {tasks.length} total</p>
                </div>
                <div className="border-l-2 border-blue-500/30 pl-4 py-1">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">VcChic (Shopify Live)</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-300">
                    R$ {fmt(performanceData.vcchic?.mtdSales || 0)} mês • Hoje: R$ {fmt(performanceData.vcchic?.todaySales || 0)}
                  </p>
                </div>
                <div className="border-l-2 border-orange-500/30 pl-4 py-1">
                  <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Sezo (Shopify Live)</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-300">
                    R$ {fmt(performanceData.sezo?.mtdSales || 0)} mês • Hoje: R$ {fmt(performanceData.sezo?.todaySales || 0)}
                  </p>
                </div>
                <div className="border-l-2 border-teal-500/30 pl-4 py-1">
                  <p className="text-[10px] font-black text-teal-400 uppercase mb-1">Moriel (Shopify Live)</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-300">
                    R$ {fmt(performanceData.moriel?.mtdSales || 0)} mês • Hoje: R$ {fmt(performanceData.moriel?.todaySales || 0)}
                  </p>
                </div>
                <div className="border-l-2 border-slate-700 pl-4 py-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Sistema</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-400">Nexus Cloud sincronizado</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D DIGITAL */}
        {activeUnit === '3D Digital' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">Funil de Conversão</h3>
              <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-3xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total de Leads</p>
                  <p className="text-3xl font-black text-slate-900">{leads3D.length}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Diagnósticos Pagos (Mapa)</p>
                  <p className="text-3xl font-black text-indigo-600">{leads3D.filter(l => l.product === 'Mapa da Clareza').length}</p>
                </div>
                <button onClick={() => navigate('/pipeline')} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                  Ver Pipeline Completo
                </button>
              </div>
            </div>
            <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Ações Estratégicas 3D</h3>
                <Sparkles size={16} className="text-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {tasks.filter(t => t.category === '3D Digital').slice(0, 4).map(task => (
                  <div key={task.id} className="p-5 border border-slate-50 bg-slate-50/30 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                    <span className="text-xs font-bold text-slate-700">{task.title}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GRUPO VCCHIC */}
        {activeUnit === 'Grupo VcChic' && (
          <div className="space-y-8">

            {/* KPIs consolidados do Grupo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-pink-600 text-white rounded-xl flex items-center justify-center"><DollarSign size={15} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receita Grupo MTD</p>
                </div>
                <p className="text-2xl font-black text-slate-900">R$ {fmt(totalMtdSales)}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{Object.keys(performanceData).length} lojas consolidadas</p>
              </div>
              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center"><ShoppingBag size={15} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VcChic Hoje</p>
                  <span className={`h-1.5 w-1.5 rounded-full ${vcchicLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-ping'} inline-block`}></span>
                </div>
                {vcchicLoading
                  ? <Loader2 size={20} className="animate-spin text-slate-300" />
                  : <p className="text-2xl font-black text-slate-900">R$ {fmt(performanceData.vcchic?.todaySales || 0)}</p>
                }
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {vcchicLoading ? 'Atualizando...' : vcchicLastSync ? `Sync ${vcchicLastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · 5min` : 'Shopify live'}
                </p>
              </div>
              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><TrendingUp size={15} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROAS Global</p>
                </div>
                <p className={`text-2xl font-black ${globalMtdRoas >= 2.5 ? 'text-emerald-600' : 'text-amber-600'}`}>{globalMtdRoas.toFixed(2)}x</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Meta: 2.5x</p>
              </div>
              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center"><Package size={15} /></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invest. Ads</p>
                </div>
                <p className="text-2xl font-black text-slate-900">R$ {fmt(totalMtdSpend)}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Total grupo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Formulário de lançamento */}
              <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Calculator size={20} /></div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest leading-none">Lançamento de Vendas</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Entrada de dados operacional</span>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Loja</label>
                    <select
                      value={newMetric.store_name}
                      onChange={e => setNewMetric({ ...newMetric, store_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/5"
                    >
                      <option value="vcchic">VcChic — só Gasto Ads ⚡</option>
                      <option value="mivave">Mivave</option>
                      <option value="sezo">Sezo — só Gasto Ads ⚡</option>
                      <option value="moriel">Moriel — só Gasto Ads ⚡</option>
                    </select>
                    {['vcchic', 'sezo', 'moriel'].includes(newMetric.store_name) && (
                      <p className={`text-[9px] font-bold mt-1.5 ml-1 flex items-center gap-1 ${
                        newMetric.store_name === 'vcchic' ? 'text-blue-600' :
                        newMetric.store_name === 'sezo'   ? 'text-orange-600' : 'text-teal-600'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                        Vendas de {newMetric.store_name === 'vcchic' ? 'VcChic' : newMetric.store_name === 'sezo' ? 'Sezo' : 'Moriel'} vêm automaticamente do Shopify
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        {['vcchic', 'sezo', 'moriel'].includes(newMetric.store_name) ? 'Vendas (auto ⚡)' : 'Vendas (R$)'}
                      </label>
                      <input
                        type="number" placeholder="0,00"
                        value={newMetric.sales}
                        disabled={['vcchic', 'sezo', 'moriel'].includes(newMetric.store_name)}
                        onChange={e => setNewMetric({ ...newMetric, sales: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-black outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gasto Ads (R$)</label>
                      <input
                        type="number" placeholder="0,00"
                        value={newMetric.spend}
                        onChange={e => setNewMetric({ ...newMetric, spend: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-black outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveMetric}
                    disabled={isSavingMetric || (!newMetric.sales && !['vcchic', 'sezo', 'moriel'].includes(newMetric.store_name)) || !newMetric.spend}
                    className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${
                      saveSuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'
                    } disabled:opacity-40`}
                  >
                    {isSavingMetric ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Zap size={16} />}
                    {isSavingMetric ? 'Gravando...' : saveSuccess ? 'Sincronizado!' : 'Push to Cloud'}
                  </button>
                </div>
              </div>

              {/* Cards de lojas — com badge LIVE */}
              <div className="lg:col-span-7 space-y-4 overflow-y-auto max-h-[520px] pr-2 custom-scrollbar">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance por Loja</span>
                  <button
                    onClick={() => { loadVcchicOrders(); loadSezoOrders(); loadMorielOrders(); }}
                    disabled={vcchicLoading || sezoLoading || morielLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-all text-[9px] font-black uppercase"
                  >
                    <RefreshCw size={10} className={(vcchicLoading || sezoLoading || morielLoading) ? 'animate-spin' : ''} />
                    {(vcchicLoading || sezoLoading || morielLoading) ? 'Atualizando...' : 'Shopify Live'}
                  </button>
                </div>

                {(Object.entries(performanceData) as [string, StoreStats][]).map(([key, store]) => (
                  <div
                    key={key}
                    className={`bg-white rounded-[2rem] p-6 border shadow-lg flex items-center justify-between transition-all group ${
                      store.isMain ? 'ring-2 ring-blue-50' : 'border-slate-100'
                    } ${key === 'moriel' ? 'ring-2 ring-teal-100' : ''}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl ${store.bg} ${store.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative`}>
                        <Store size={24} />
                        {store.isLive && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow animate-pulse"></span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{store.name}</h4>
                          {store.isLive && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">Live</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {store.isLive ? 'Shopify · Tempo Real' : 'Performance MTD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Mês</p>
                        {store.isLive && loadingByStore[key]
                          ? <Loader2 size={16} className="animate-spin text-slate-300 ml-auto" />
                          : <p className="text-lg font-black text-slate-900">R$ {fmt(store.mtdSales)}</p>
                        }
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ROAS</p>
                        <p className={`text-lg font-black ${store.roas >= 2.5 ? 'text-emerald-600' : store.roas > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                          {store.roas > 0 ? `${store.roas.toFixed(2)}x` : '—'}
                        </p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Hoje</p>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                          store.todaySales > 0
                            ? key === 'moriel' ? 'bg-teal-600 text-white' : 'bg-blue-600 text-white'
                            : 'bg-slate-50 text-slate-300'
                        }`}>
                          R$ {fmt(store.todaySales)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => navigate('/shopify')}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-teal-300 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} /> Abrir Dashboard Completo Moriel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
