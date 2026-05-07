import React, { useState } from 'react'
import { Building2 } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import FinancialEntriesPanel from '@/components/financial/FinancialEntriesPanel'

type Digital3DUnit =
  | '3d_cend'
  | '3d_marketing'
  | '3d_producao'
  | '3d_inovacao'
  | '3d_negocios'
  | '3d_csc'

const UNITS: { id: Digital3DUnit; label: string }[] = [
  { id: '3d_cend', label: 'CEND' },
  { id: '3d_marketing', label: 'Marketing' },
  { id: '3d_producao', label: 'Produção' },
  { id: '3d_inovacao', label: 'Inovação' },
  { id: '3d_negocios', label: 'Negócios' },
  { id: '3d_csc', label: 'CSC' },
]

function getPeriodDates() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = now.toISOString().slice(0, 10)
  return { start, end }
}

const Digital3DFinancialsContent: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<Digital3DUnit>('3d_cend')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">3D Digital — Financeiro</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Lançamentos por divisão interna
          </p>
        </div>
      </div>

      {/* Unit selector */}
      <div className="flex gap-2 flex-wrap">
        {UNITS.map(u => (
          <button
            key={u.id}
            onClick={() => setSelectedUnit(u.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              selectedUnit === u.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* Entries panel */}
      <FinancialEntriesPanel
        businessUnit={selectedUnit}
        period={getPeriodDates()}
      />
    </div>
  )
}

const Digital3DFinancials: React.FC = () => (
  <RoleGuard roles={['ceo']}>
    <Digital3DFinancialsContent />
  </RoleGuard>
)

export default Digital3DFinancials
