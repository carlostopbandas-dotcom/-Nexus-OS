import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  financialEntriesService,
  type FinancialEntry,
  type NewFinancialEntry,
} from '@/services/financialEntriesService'

// ── Constants ──────────────────────────────────────────────────────────────

const ENTRY_TYPE_LABEL: Record<FinancialEntry['entry_type'], string> = {
  cmv: 'CMV',
  expense: 'Despesa',
  revenue: 'Receita',
}

const ENTRY_TYPE_COLORS: Record<FinancialEntry['entry_type'], string> = {
  cmv: 'bg-orange-100 text-orange-700',
  expense: 'bg-red-100 text-red-700',
  revenue: 'bg-emerald-100 text-emerald-700',
}

const STORES = ['vcchic', 'moriel', 'sezo'] as const
const STORE_LABEL: Record<string, string> = { vcchic: 'VcChic', moriel: 'Moriel', sezo: 'Sezo' }

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// ── Entry Modal ────────────────────────────────────────────────────────────

interface EntryModalProps {
  businessUnit: string
  entry?: FinancialEntry
  onClose: () => void
  onSaved: () => void
}

const EntryModal: React.FC<EntryModalProps> = ({ businessUnit, entry, onClose, onSaved }) => {
  const isConsolidated = businessUnit === 'consolidated'
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<NewFinancialEntry>({
    business_unit: isConsolidated ? 'vcchic' : businessUnit,
    entry_type: entry?.entry_type ?? 'expense',
    category: entry?.category ?? '',
    amount: entry?.amount ?? 0,
    description: entry?.description ?? '',
    entry_date: entry?.entry_date ?? new Date().toISOString().slice(0, 10),
  })

  const set = <K extends keyof NewFinancialEntry>(key: K, value: NewFinancialEntry[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const valid = form.amount > 0 && form.entry_date.length === 10 && form.entry_type

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    const payload: NewFinancialEntry = {
      ...form,
      category: form.category || undefined,
      description: form.description || undefined,
    }

    const result = entry
      ? await financialEntriesService.updateEntry(entry.id, payload)
      : await financialEntriesService.createEntry(payload)

    setSaving(false)
    if (result.error) {
      toast.error(`Erro ao salvar: ${result.error}`)
      return
    }
    toast.success(entry ? 'Lançamento atualizado.' : 'Lançamento criado.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">
            {entry ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Loja — somente quando consolidado */}
          {isConsolidated && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Loja
              </label>
              <select
                value={form.business_unit}
                onChange={e => set('business_unit', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STORES.map(s => (
                  <option key={s} value={s}>{STORE_LABEL[s]}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Tipo *
            </label>
            <select
              value={form.entry_type}
              onChange={e => set('entry_type', e.target.value as FinancialEntry['entry_type'])}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="expense">Despesa</option>
              <option value="cmv">CMV</option>
              <option value="revenue">Receita</option>
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Categoria
            </label>
            <input
              type="text"
              value={form.category ?? ''}
              onChange={e => set('category', e.target.value)}
              placeholder="ex: Frete, Embalagem, Aluguel"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Valor (R$) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={e => set('amount', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Data *
            </label>
            <input
              type="date"
              value={form.entry_date}
              onChange={e => set('entry_date', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Detalhes opcionais..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────

interface FinancialEntriesPanelProps {
  businessUnit: string
  period: { start: string; end: string }
}

const FinancialEntriesPanel: React.FC<FinancialEntriesPanelProps> = ({ businessUnit, period }) => {
  const { userRole } = useAuth()
  const canEdit = userRole === 'ceo'

  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<FinancialEntry | undefined>()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (businessUnit === 'consolidated') {
      const results = await Promise.all(
        STORES.map(store =>
          financialEntriesService.getEntries({ businessUnit: store, period })
        )
      )
      const errorResult = results.find(r => r.error)
      if (errorResult) { setError(errorResult.error!); setLoading(false); return }
      const all = results.flatMap(r => r.data ?? [])
      all.sort((a, b) => b.entry_date.localeCompare(a.entry_date))
      setEntries(all)
    } else {
      const { data, error: err } = await financialEntriesService.getEntries({ businessUnit, period })
      if (err) { setError(err); setLoading(false); return }
      setEntries(data ?? [])
    }
    setLoading(false)
  }, [businessUnit, period])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditEntry(undefined); setModalOpen(true) }
  const openEdit = (entry: FinancialEntry) => { setEditEntry(entry); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditEntry(undefined) }
  const onSaved = () => { closeModal(); load() }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const { error: err } = await financialEntriesService.deleteEntry(id)
    setDeleting(false)
    if (err) { toast.error(`Erro ao excluir: ${err}`); return }
    toast.success('Lançamento excluído.')
    setConfirmDeleteId(null)
    load()
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            Lançamentos Financeiros
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">CMV · Despesas · Receitas manuais</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus size={13} />
            Adicionar Lançamento
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-xs font-bold">Nenhum lançamento no período</p>
          {canEdit && (
            <p className="text-[10px] mt-1">Clique em "Adicionar Lançamento" para registrar o primeiro.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Data</th>
                  <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Tipo</th>
                  <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Categoria</th>
                  {businessUnit === 'consolidated' && (
                    <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Loja</th>
                  )}
                  <th className="text-right px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Valor</th>
                  <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Descrição</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 font-bold whitespace-nowrap">
                      {new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${ENTRY_TYPE_COLORS[entry.entry_type]}`}>
                        {ENTRY_TYPE_LABEL[entry.entry_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.category ?? '—'}</td>
                    {businessUnit === 'consolidated' && (
                      <td className="px-4 py-3 text-slate-500">{STORE_LABEL[entry.business_unit] ?? entry.business_unit}</td>
                    )}
                    <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatBRL(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                      {entry.description ?? '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {confirmDeleteId === entry.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-red-600 font-bold mr-1">Confirmar?</span>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleting}
                              className="p-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-40"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(entry)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(entry.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <EntryModal
          businessUnit={businessUnit}
          entry={editEntry}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

export default FinancialEntriesPanel
