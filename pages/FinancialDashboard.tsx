import React, { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, Megaphone, BarChart2, AlertTriangle } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuth } from '@/components/auth/AuthProvider'
import { financialService, type StoreFinancials, type GroupSummary } from '@/services/financialService'

// ── Period helpers ─────────────────────────────────────────────────────────

type PeriodKey = 'current_month' | 'last_30' | 'last_90'

const PERIODS: { label: string; value: PeriodKey }[] = [
  { label: 'Mês atual', value: 'current_month' },
  { label: 'Últimos 30d', value: 'last_30' },
  { label: 'Últimos 90d', value: 'last_90' },
]

function getPeriodDates(key: PeriodKey): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  if (key === 'current_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    return { start, end }
  }
  const days = key === 'last_30' ? 30 : 90
  const start = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10)
  return { start, end }
}

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  warn,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  warn?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {warn ? (
        <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
          {warn}
        </span>
      ) : sub ? (
        <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>
      ) : null}
    </div>
  )
}

function KpiSkeleton() {
  return <div className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
}

// ── Format helpers ─────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Store selector ─────────────────────────────────────────────────────────

type StoreId = 'consolidated' | 'vcchic' | 'moriel' | 'sezo'

const CEO_STORES: { id: StoreId; label: string }[] = [
  { id: 'consolidated', label: 'Consolidado' },
  { id: 'vcchic', label: 'VcChic' },
  { id: 'moriel', label: 'Moriel' },
  { id: 'sezo', label: 'Sezo' },
]

// ── Main content (inside RoleGuard) ───────────────────────────────────────

const FinancialDashboardContent: React.FC = () => {
  const { userRole } = useAuth()
  const isGestor = userRole === 'gestor_vcchic'

  const [selectedStore, setSelectedStore] = useState<StoreId>(isGestor ? 'vcchic' : 'consolidated')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('current_month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeData, setStoreData] = useState<StoreFinancials | null>(null)
  const [groupData, setGroupData] = useState<GroupSummary | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const period = getPeriodDates(selectedPeriod)

    if (selectedStore === 'consolidated') {
      const { data, error: err } = await financialService.getGroupSummary(period)
      if (err) { setError(err); setLoading(false); return }
      setGroupData(data)
      setStoreData(null)
    } else {
      const { data, error: err } = await financialService.getStoreFinancials(selectedStore, period)
      if (err) { setError(err); setLoading(false); return }
      setStoreData(data)
      setGroupData(null)
    }
    setLoading(false)
  }, [selectedStore, selectedPeriod])

  useEffect(() => { load() }, [load])

  // Normalise display values
  const revenue = storeData?.revenue ?? groupData?.totalRevenue ?? 0
  const adSpend = storeData?.adSpend ?? groupData?.totalAdSpend ?? 0
  const grossProfit = storeData?.grossProfit ?? groupData?.totalGrossProfit ?? 0
  const roas = storeData?.roas ?? groupData?.roas ?? null
  const adsConfigured = storeData?.adsConfigured ?? groupData?.adsConfigured ?? false

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Dashboard Financeiro</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Receita · Ads · ROAS · Lucro
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === p.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store selector — CEO only */}
      {!isGestor && (
        <div className="flex gap-2 flex-wrap">
          {CEO_STORES.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStore(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedStore === s.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 leading-relaxed">
            <strong>Erro ao carregar dados financeiros:</strong> {error}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<DollarSign size={14} />}
            label="Receita"
            value={`R$ ${fmt(revenue)}`}
            sub={revenue === 0 ? 'Sem dados de vendas' : undefined}
          />
          <KpiCard
            icon={<Megaphone size={14} />}
            label="Investimento Ads"
            value={`R$ ${fmt(adSpend)}`}
            sub={!adsConfigured ? undefined : 'Facebook Ads'}
            warn={!adsConfigured ? 'Ads não configurado' : undefined}
          />
          <KpiCard
            icon={<TrendingUp size={14} />}
            label="ROAS"
            value={roas !== null ? `${roas.toFixed(2)}x` : '—'}
            warn={!adsConfigured ? 'Ads não configurado' : undefined}
            sub={roas !== null ? 'retorno sobre investimento' : undefined}
          />
          <KpiCard
            icon={<BarChart2 size={14} />}
            label="Lucro Bruto"
            value={`R$ ${fmt(grossProfit)}`}
            sub="receita − investimento ads"
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && revenue === 0 && !adsConfigured && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Sem dados disponíveis.</strong>{' '}
            Verifique se o Shopify está sincronizado e configure{' '}
            <code className="font-mono bg-amber-100 px-1 rounded text-amber-800">
              FB_ACCESS_TOKEN_VCCHIC_BM
            </code>{' '}
            no Supabase para habilitar dados de Ads.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Page export (protected) ────────────────────────────────────────────────

const FinancialDashboard: React.FC = () => (
  <RoleGuard roles={['ceo', 'gestor_vcchic']}>
    <FinancialDashboardContent />
  </RoleGuard>
)

export default FinancialDashboard
