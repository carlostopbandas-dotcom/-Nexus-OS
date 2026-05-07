import React, { useEffect, useState } from 'react'
import { TrendingUp, MousePointerClick, Eye, DollarSign, RefreshCw, AlertTriangle, Clock, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { adsService, type AdsCampaign, type AdsSyncLog } from '@/services/adsService'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = (v: number) => v.toLocaleString('pt-BR')

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

const AdsPanelVcChic: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([])
  const [lastSync, setLastSync] = useState<AdsSyncLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    const [camRes, syncRes] = await Promise.all([
      adsService.getCampaigns('vcchic'),
      adsService.getLastSync('vcchic'),
    ])
    setCampaigns(camRes.data ?? [])
    setLastSync(syncRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSync = async () => {
    setSyncing(true)
    const { error } = await adsService.triggerSync()
    if (error) {
      toast.error(`Sync falhou: ${error}`)
    } else {
      toast.success('Sincronização concluída')
      await load()
    }
    setSyncing(false)
  }

  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0)
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0)
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-blue-600" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Facebook Ads — VcChic</h3>
          {lastSync && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-2">
              <Clock size={10} />
              {new Date(lastSync.syncedAt).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : lastSync?.status === 'error' && campaigns.length === 0 ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 leading-relaxed">
            <strong>Erro na última sincronização:</strong> {lastSync.errorMsg ?? 'Erro desconhecido'}
            <span className="block text-red-400 mt-0.5">
              {new Date(lastSync.syncedAt).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Aguardando primeira sincronização.</strong>{' '}
            Configure{' '}
            <code className="font-mono bg-amber-100 px-1 rounded text-amber-800">
              FB_ACCESS_TOKEN_VCCHIC_BM
            </code>{' '}
            no Supabase e clique em "Sincronizar agora".
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<DollarSign size={14} />} label="Gasto Total" value={`R$ ${fmt(totalSpend)}`} sub="últimos 30 dias" />
            <KpiCard icon={<Eye size={14} />} label="Impressões" value={fmtInt(totalImpressions)} sub="alcance total" />
            <KpiCard icon={<MousePointerClick size={14} />} label="Cliques" value={fmtInt(totalClicks)} sub="cliques no link" />
            <KpiCard icon={<TrendingUp size={14} />} label="CTR Médio" value={`${avgCtr.toFixed(2)}%`} sub="taxa de clique" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'}
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {campaigns.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.campaignName}</p>
                    <p className="text-[10px] text-slate-400">
                      {fmtInt(c.impressions)} imp · {fmtInt(c.clicks)} cliques
                    </p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">CTR</p>
                      <p className="text-xs font-black text-slate-700">{c.ctr.toFixed(2)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Gasto</p>
                      <p className="text-xs font-black text-slate-900">R$ {fmt(c.spend)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdsPanelVcChic
