import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, TrendingUp, Package, RefreshCw, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';

interface ShopifyOrder {
  id: number;
  name: string;
  total_price: string;
  financial_status: string;
  created_at: string;
  customer: { first_name: string; last_name: string; email: string } | null;
  line_items: { title: string; quantity: number; price: string }[];
}

interface StorePageProps {
  storeName: string;
  apiEndpoint: string;
  accentColor: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paid:     { label: 'Pago',      color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={14} /> },
  pending:  { label: 'Pendente',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: <Clock size={14} /> },
  refunded: { label: 'Estornado', color: 'text-red-500',     bg: 'bg-red-50',     icon: <XCircle size={14} /> },
  voided:   { label: 'Cancelado', color: 'text-slate-400',   bg: 'bg-slate-50',   icon: <XCircle size={14} /> },
};

const colorMap: Record<string, { btn: string; kpi: string; dot: string }> = {
  blue:   { btn: 'hover:bg-blue-600',   kpi: 'bg-blue-600',   dot: 'bg-blue-500'   },
  orange: { btn: 'hover:bg-orange-600', kpi: 'bg-orange-600', dot: 'bg-orange-500' },
  teal:   { btn: 'hover:bg-teal-600',   kpi: 'bg-teal-600',   dot: 'bg-teal-500'   },
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const REFRESH_MS = 5 * 60 * 1000;

const StorePage: React.FC<StorePageProps> = ({ storeName, apiEndpoint, accentColor }) => {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState(REFRESH_MS);
  const colors = colorMap[accentColor] || colorMap.blue;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${apiEndpoint}/orders.json?limit=250&status=any&fields=id,name,total_price,financial_status,created_at,customer,line_items`
      );
      const data = await res.json();
      setOrders(data.orders || []);
      setLastSync(new Date());
      setNextRefresh(REFRESH_MS);
    } catch {
      setError('Erro ao carregar pedidos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNextRefresh(prev => Math.max(0, prev - 1000)), 1000);
    return () => clearInterval(tick);
  }, [lastSync]);

  const paid      = orders.filter(o => o.financial_status === 'paid');
  const pending   = orders.filter(o => o.financial_status === 'pending');
  const revenue   = paid.reduce((acc, o) => acc + parseFloat(o.total_price), 0);
  const avgTicket = paid.length > 0 ? revenue / paid.length : 0;

  const now      = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${monthStr}-${String(now.getDate()).padStart(2, '0')}`;

  const monthPaid = paid.filter(o => o.created_at.slice(0, 7) === monthStr);
  const monthRev  = monthPaid.reduce((acc, o) => acc + parseFloat(o.total_price), 0);
  const todayRev  = paid.filter(o => o.created_at.slice(0, 10) === todayStr)
                       .reduce((acc, o) => acc + parseFloat(o.total_price), 0);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.financial_status === filter);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : `${colors.dot} animate-ping`}`}></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Shopify Live</span>
            {lastSync && !loading && (
              <span className="text-[9px] font-bold text-slate-400">
                · Sync {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            {storeName} <span className={`text-${accentColor}-600`}>Store</span>
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Dashboard de Vendas em Tempo Real</p>
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
              <RefreshCw size={12} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {Math.ceil(nextRefresh / 1000)}s
              </span>
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest ${colors.btn} transition-all shadow-xl disabled:opacity-50`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-red-600 text-sm font-bold">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 ${colors.kpi} text-white rounded-2xl flex items-center justify-center`}><DollarSign size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita Mês</p>
          </div>
          <p className="text-3xl font-black text-slate-900">R$ {fmt(monthRev)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">{monthPaid.length} pedidos pagos</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center"><TrendingUp size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoje</p>
          </div>
          <p className="text-3xl font-black text-slate-900">R$ {fmt(todayRev)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Faturamento do dia</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center"><ShoppingBag size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pedidos</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{orders.length}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">{paid.length} pagos • {pending.length} pendentes</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-600 text-white rounded-2xl flex items-center justify-center"><Package size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio</p>
          </div>
          <p className="text-3xl font-black text-slate-900">R$ {fmt(avgTicket)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Pedidos pagos</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center"><DollarSign size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita Total</p>
          </div>
          <p className="text-3xl font-black text-slate-900">R$ {fmt(revenue)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Todos os pedidos pagos</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-slate-50">
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Pedidos Recentes</h3>
          <div className="flex bg-slate-50 p-1 rounded-2xl gap-1">
            {(['all', 'paid', 'pending'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagos' : 'Pendentes'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <RefreshCw size={28} className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center p-16 text-slate-300 text-sm font-bold">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.slice(0, 20).map(order => {
              const status = statusConfig[order.financial_status] || statusConfig['pending'];
              const customerName = order.customer
                ? `${order.customer.first_name} ${order.customer.last_name}`
                : 'Cliente não identificado';
              const date = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
              const time = new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={order.id} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xs group-hover:${colors.kpi} group-hover:text-white transition-all`}>
                      {order.name.replace('#', '')}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {order.line_items[0]?.title || '—'}
                        {order.line_items.length > 1 ? ` +${order.line_items.length - 1}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Data</p>
                      <p className="text-xs font-bold text-slate-600">{date} {time}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black ${status.color} ${status.bg}`}>
                      {status.icon}
                      {status.label}
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-sm font-black text-slate-900">R$ {fmt(parseFloat(order.total_price))}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;
