import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { leadsService } from '@/services/leadsService';
import { LeadStatus, PRODUCT_BUSINESS_UNIT, type Lead, type PaymentStatus, type LeadBusinessUnit } from '@/types';
import {
  Users, Search, ArrowRight, Phone, CheckCircle2,
  AlertCircle, XCircle, BookOpen, TrendingUp, DollarSign, ChevronDown,
  Sparkles, Loader2, Copy
} from 'lucide-react';
import { useClientFollowUpAlert } from '../hooks/useClientFollowUpAlert';
import { toast } from 'sonner';

type ClientView = 'Todos' | '3D Digital' | 'Grupo VcChic';

const MODULE_STEPS = ['M1', 'M2', 'M3', 'M4', 'M5'];

const MODULE_PROGRESS: Record<string, number> = {
  M1: 20, M2: 40, M3: 60, M4: 80, M5: 100, 'Jornada Completa': 100,
};

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  'Em dia':       { label: 'Em dia',       color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={13} /> },
  'Pendente':     { label: 'Pendente',     color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: <AlertCircle size={13} /> },
  'Inadimplente': { label: 'Inadimplente', color: 'text-red-600 bg-red-50 border-red-200',             icon: <XCircle size={13} /> },
};

const UNIT_BORDER: Record<LeadBusinessUnit, string> = {
  '3D Digital':   'border-l-indigo-500',
  'Grupo VcChic': 'border-l-pink-500',
};

const VIEWS: ClientView[] = ['Todos', '3D Digital', 'Grupo VcChic'];

const URGENCY_CONFIG = {
  alta:  { bg: 'bg-rose-50',   text: 'text-rose-700',   badge: 'text-rose-600'   },
  media: { bg: 'bg-amber-50',  text: 'text-amber-700',  badge: 'text-amber-600'  },
  baixa: { bg: 'bg-slate-50',  text: 'text-slate-600',  badge: 'text-slate-500'  },
} as const;

const AIFollowUpAlert: React.FC<{ client: import('@/types').Lead }> = ({ client }) => {
  const { daysWithoutFollowUp, needsAlert, alert, loading, analyze } = useClientFollowUpAlert(client);

  if (!needsAlert) return null;

  const copyToClipboard = async () => {
    if (!alert) return;
    try {
      await navigator.clipboard.writeText(alert.suggestion);
      import('sonner').then(({ toast }) => toast.success('Mensagem copiada!'));
    } catch {
      import('sonner').then(({ toast }) => toast.error('Não foi possível copiar.'));
    }
  };

  const urgencyCfg = alert ? URGENCY_CONFIG[alert.urgency] : null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-50">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
          <AlertCircle size={11} />
          {daysWithoutFollowUp !== null
            ? `Sem follow-up há ${daysWithoutFollowUp}d`
            : 'Sem follow-up registrado'}
        </span>
        {!alert && (
          <button
            onClick={analyze}
            disabled={loading}
            title="Gerar sugestão de mensagem WhatsApp com IA"
            className="flex items-center gap-1 text-[10px] font-black text-indigo-500 hover:text-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? <Loader2 size={11} className="animate-spin" />
              : <Sparkles size={11} />}
            Sugestão IA
          </button>
        )}
      </div>

      {alert && urgencyCfg && (
        <div className={`mt-2 p-3 rounded-xl ${urgencyCfg.bg}`}>
          <p className={`text-[11px] leading-relaxed ${urgencyCfg.text}`}>{alert.suggestion}</p>
          <button
            onClick={copyToClipboard}
            title="Copiar mensagem para área de transferência"
            className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Copy size={11} /> Copiar mensagem
          </button>
        </div>
      )}
    </div>
  );
};

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { leads, updateLead } = useAppStore();
  const [activeView, setActiveView] = useState<ClientView>('Todos');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const activeClients = useMemo(
    () => leads.filter(l => l.status === LeadStatus.WON),
    [leads]
  );

  const viewClients = useMemo(() => {
    let list = activeClients;
    if (activeView !== 'Todos') {
      list = list.filter(l => (l.businessUnit ?? PRODUCT_BUSINESS_UNIT[l.product]) === activeView);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.product.toLowerCase().includes(q));
    }
    return list;
  }, [activeClients, activeView, search]);

  const totalRevenue = useMemo(
    () => activeClients.reduce((acc, l) => acc + l.value, 0),
    [activeClients]
  );

  const handlePaymentChange = async (client: Lead, status: PaymentStatus) => {
    setUpdatingId(client.id);
    const { error } = await leadsService.update(client.id, { paymentStatus: status });
    if (error) {
      toast.error('Erro ao atualizar pagamento');
    } else {
      updateLead(client.id, { paymentStatus: status });
      toast.success(`${client.name} — ${status}`);
    }
    setUpdatingId(null);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Clientes Ativos</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe o progresso e saúde financeira de cada cliente</p>
        </div>
        <button
          onClick={() => navigate('/pipeline')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all"
        >
          Ver Pipeline <ArrowRight size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Clientes Ativos', value: activeClients.length, icon: <Users size={20} className="text-indigo-500" />, sub: 'total convertidos' },
          { label: 'Receita Total', value: fmt(totalRevenue), icon: <DollarSign size={20} className="text-emerald-500" />, sub: 'contratos fechados' },
          { label: 'Inadimplentes', value: activeClients.filter(l => l.paymentStatus === 'Inadimplente').length, icon: <TrendingUp size={20} className="text-red-500" />, sub: 'requerem atenção' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-tight leading-tight">{s.label}</span>
              <span className="hidden sm:block">{s.icon}</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-900 truncate">{s.value}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1 hidden sm:block">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 shadow-sm overflow-x-auto">
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === v
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {v}
              {v !== 'Todos' && (
                <span className="ml-1.5 opacity-70">
                  ({activeClients.filter(l => (l.businessUnit ?? PRODUCT_BUSINESS_UNIT[l.product]) === v).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Client Cards */}
      {viewClients.length === 0 ? (
        <EmptyState hasClients={activeClients.length > 0} navigate={navigate} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {viewClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              updating={updatingId === client.id}
              onPaymentChange={handlePaymentChange}
              fmt={fmt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ClientCard: React.FC<{
  client: Lead;
  updating: boolean;
  onPaymentChange: (client: Lead, status: PaymentStatus) => void;
  fmt: (v: number) => string;
}> = ({ client, updating, onPaymentChange, fmt }) => {
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const paymentStatus = client.paymentStatus ?? 'Em dia';
  const payment = PAYMENT_CONFIG[paymentStatus];
  const progress = client.module ? MODULE_PROGRESS[client.module] ?? 0 : null;
  const isNegocioSolido = client.product === 'Negócio Sólido';
  const bu = client.businessUnit ?? PRODUCT_BUSINESS_UNIT[client.product] ?? '3D Digital';
  const borderColor = UNIT_BORDER[bu as LeadBusinessUnit] ?? 'border-l-slate-300';

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm border-l-4 ${borderColor} p-5 space-y-4`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-sm truncate">{client.name}</h3>
          <p className="text-xs text-slate-400 truncate">{client.email}</p>
        </div>
        <div className="relative">
          <button
            disabled={updating}
            onClick={() => setShowPaymentMenu(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${payment.color}`}
          >
            {payment.icon}
            {payment.label}
            <ChevronDown size={11} />
          </button>
          {showPaymentMenu && (
            <div className="absolute right-0 top-8 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-40">
              {(Object.keys(PAYMENT_CONFIG) as PaymentStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => { onPaymentChange(client, s); setShowPaymentMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-all ${PAYMENT_CONFIG[s].color}`}
                >
                  {PAYMENT_CONFIG[s].icon} {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product + BU badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[11px] font-bold border border-indigo-100">
          {client.product}
        </span>
        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
          bu === 'Grupo VcChic'
            ? 'bg-pink-50 text-pink-700 border-pink-100'
            : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {bu}
        </span>
        {client.module && (
          <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-xl text-[11px] font-bold border border-violet-100 flex items-center gap-1">
            <BookOpen size={11} /> {client.module}
          </span>
        )}
      </div>

      {/* Module progress (only for Negócio Sólido) */}
      {isNegocioSolido && progress !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso</span>
            <span className="text-[10px] font-black text-indigo-600">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-1 mt-1">
            {MODULE_STEPS.map((m, i) => {
              const currentIdx = MODULE_STEPS.indexOf(client.module ?? '');
              return (
                <div
                  key={m}
                  className={`flex-1 text-center text-[9px] font-black py-0.5 rounded-md ${
                    i <= currentIdx
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Value + follow-up */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <span className="text-sm font-black text-slate-900">{fmt(client.value)}</span>
        <div className="flex items-center gap-2">
          {client.followUpDate && (
            <span className="text-[10px] text-slate-400 font-bold">
              Follow-up: {new Date(client.followUpDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {client.whatsapp && (
            <a
              href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-[11px] font-bold hover:bg-emerald-100 transition-all"
            >
              <Phone size={11} /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* AI Follow-up Alert — Story 3.3 */}
      <AIFollowUpAlert client={client} />
    </div>
  );
};

const EmptyState: React.FC<{ hasClients: boolean; navigate: (p: string) => void }> = ({ hasClients, navigate }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 border border-indigo-100">
      <Users size={36} className="text-indigo-400" />
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-2">
      {hasClients ? 'Nenhum cliente nesta visão' : 'Nenhum cliente ativo ainda'}
    </h3>
    <p className="text-slate-500 text-sm max-w-sm mb-6">
      {hasClients
        ? 'Tente outra aba ou ajuste o filtro de busca.'
        : 'Quando um lead for marcado como Vendido no Pipeline, ele aparece aqui automaticamente.'}
    </p>
    {!hasClients && (
      <button
        onClick={() => navigate('/pipeline')}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all"
      >
        Ir para o Pipeline <ArrowRight size={14} />
      </button>
    )}
  </div>
);

export default Clients;
