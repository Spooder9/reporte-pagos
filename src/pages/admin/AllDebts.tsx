import React, { useState } from 'react'
import { useDebts } from '../../hooks/useDebts'
import { useAllPayments } from '../../hooks/usePayments'
import { formatCurrency } from '../../lib/calculations'
import { Search, CreditCard, Users, Percent, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function AllDebts() {
  const { debts, loading } = useDebts()
  const { payments } = useAllPayments()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  if (loading) return <LoadingSpinner />

  const filtered = debts.filter(d => {
    const m = d.description.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    return m && (statusFilter === 'all' || d.status === statusFilter)
  })

  const statusBadge = (s: string) => {
    if (s === 'active') return <span className="badge-active">Activa</span>
    if (s === 'completed') return <span className="badge-completed">Completada</span>
    return <span className="badge-overdue">Vencida</span>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Todas las Deudas</h1>
        <p className="text-gray-500 text-sm mt-1">{debts.length} créditos registrados</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field sm:w-40">
          <option value="all">Todos</option>
          <option value="active">Activas</option>
          <option value="completed">Completadas</option>
          <option value="overdue">Vencidas</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No se encontraron deudas</p>
          </div>
        ) : filtered.map(debt => {
          const paid = payments.filter(p => p.debt_id === debt.id).reduce((s, p) => s + p.amount, 0)
          const pct = debt.total_amount > 0 ? Math.round((paid / debt.total_amount) * 100) : 0
          return (
            <div key={debt.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{debt.code}</span>
                    {statusBadge(debt.status)}
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">{debt.description}</h3>
                  {debt.product && <p className="text-sm text-gray-500 mt-0.5">Producto: {debt.product}</p>}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{debt.interest_rate}% anual</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{debt.months} meses</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {debt.debt_members?.map(m => m.profile?.name).join(', ')}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso</span><span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                </div>
                <div className="sm:text-right flex-shrink-0 space-y-1">
                  <p className="text-xs text-gray-400">Capital</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(debt.amount)}</p>
                  <p className="text-xs text-gray-500">Cuota: <span className="font-semibold text-red-600">{formatCurrency(debt.monthly_payment)}/mes</span></p>
                  <p className="text-xs text-gray-500">Pagado: <span className="font-semibold text-green-600">{formatCurrency(paid)}</span></p>
                  <p className="text-xs text-gray-500">Pendiente: <span className="font-semibold">{formatCurrency(Math.max(0, debt.total_amount - paid))}</span></p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
