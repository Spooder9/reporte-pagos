import React from 'react'
import { useDebts } from '../../hooks/useDebts'
import { useAllPayments } from '../../hooks/usePayments'
import { formatCurrency } from '../../lib/calculations'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function Reports() {
  const { debts, loading: ld } = useDebts()
  const { payments, loading: lp } = useAllPayments()

  if (ld || lp) return <LoadingSpinner />

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0)
  const totalDebt = debts.reduce((s, d) => s + d.total_amount, 0)
  const totalPending = totalDebt - totalCollected

  const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen financiero del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Recaudado', value: formatCurrency(totalCollected), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Pendiente', value: formatCurrency(totalPending), icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Pagos', value: payments.length.toString(), icon: Calendar, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Estado por Crédito</h2>
        <div className="space-y-4">
          {debts.map(debt => {
            const paid = payments.filter(p => p.debt_id === debt.id).reduce((s, p) => s + p.amount, 0)
            const pct = debt.total_amount > 0 ? Math.round((paid / debt.total_amount) * 100) : 0
            const count = payments.filter(p => p.debt_id === debt.id).length
            return (
              <div key={debt.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{debt.description}</p>
                    <p className="text-xs text-gray-400 font-mono">{debt.code}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(paid)} <span className="text-gray-400 font-normal">/ {formatCurrency(debt.total_amount)}</span></p>
                    <p className="text-xs text-gray-500">{count} pagos registrados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBar value={pct} />
                  <span className="text-sm font-medium text-gray-600 w-10">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Historial de Pagos</h2>
        {sortedPayments.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No hay pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha', 'Usuario', 'Crédito', 'Comprobante', 'Monto'].map(h => (
                    <th key={h} className={`py-2 px-3 text-gray-500 font-medium ${h === 'Monto' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map(p => {
                  const debt = debts.find(d => d.id === p.debt_id)
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">{p.date}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{p.profile?.name}</td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-[180px] truncate">{debt?.description}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-500 text-xs">{p.receipt_number}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-green-700">{formatCurrency(p.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
