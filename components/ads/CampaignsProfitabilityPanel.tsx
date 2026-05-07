import React, { useEffect, useState, useCallback } from 'react'
import { Megaphone, AlertTriangle } from 'lucide-react'
import {
  campaignProfitabilityService,
  ROAS_TARGET,
  type ProfitabilityStatus,
  type StoreCampaignSummary,
} from '@/services/campaignProfitabilityService'

// ── Types ──────────────────────────────────────────────────────────────────

type BusinessUnit = 'consolidated' | 'vcchic' | 'moriel' | 'sezo'

// ── Helpers ────────────────────────────────────────────────────────────────

const STORE_LABEL: Record<string, string> = {
  vcchic: 'VcChic',
  moriel: 'Moriel',
  sezo: 'Sezo',
}

const STATUS_BADGE: Record<ProfitabilityStatus, { label: string; cls: string }> = {
  profitable: { label: 'Lucrativo', cls: 'bg-emerald-100 text-emerald-700' },
  warning:    { label: 'Abaixo da meta', cls: 'bg-red-100 text-red-700' },
  no_data:    { label: 'Sem dados', cls: 'bg-slate-100 text-slate-500' },
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// ── Sub-components ─────────────────────────────────────────────────────────

function StoreSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
      <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
    </div>
  )
}

const StoreSection: React.FC<{ summary: StoreCampaignSummary }> = ({ summary }) => {
  const badge = STATUS_BADGE[summary.status]
  const roasLabel = summary.roas !== null ? ` · ${summary.roas.toFixed(1)}x` : ''

  return (
    <div className="space-y-3">
      {/* Store header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
          {STORE_LABEL[summary.store] ?? summary.store}
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}{roasLabel}
        </span>
      </div>

      {/* Campaign list */}
      {summary.campaigns.length === 0 ? (
        <div className="px-4 py-3 bg-slate-50 rounded-xl">
          <p className="text-[11px] text-slate-400 font-bold">
            {!summary.adsConfigured
              ? 'Facebook Ads não configurado — configure FB_ACCESS_TOKEN_VCCHIC_BM no Supabase'
              : 'Sem campanhas no período'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
          {summary.campaigns.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50/50 transition-colors"
            >
              <p className="text-xs font-bold text-slate-800 truncate max-w-[55%]">{c.campaignName}</p>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">CTR</p>
                  <p className="text-xs font-black text-slate-600">{c.ctr.toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Gasto</p>
                  <p className="text-xs font-black text-slate-900">{fmt(c.spend)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface CampaignsProfitabilityPanelProps {
  businessUnit: BusinessUnit
  period: { start: string; end: string }
}

const CampaignsProfitabilityPanel: React.FC<CampaignsProfitabilityPanelProps> = ({
  businessUnit,
  period,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<StoreCampaignSummary[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (businessUnit === 'consolidated') {
      const { data, error: err } = await campaignProfitabilityService.getGroupSummary(period)
      if (err) { setError(err); setLoading(false); return }
      setSummaries(data ?? [])
    } else {
      const { data, error: err } = await campaignProfitabilityService.getStoreSummary(businessUnit, period)
      if (err) { setError(err); setLoading(false); return }
      setSummaries(data ? [data] : [])
    }

    setLoading(false)
  }, [businessUnit, period])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-blue-600" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Campanhas · Lucratividade
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">
          Meta: {ROAS_TARGET.toFixed(1)}x ROAS
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <StoreSkeleton />
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">
            <strong>Erro ao carregar campanhas:</strong> {error}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {summaries.map(s => (
            <StoreSection key={s.store} summary={s} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CampaignsProfitabilityPanel
