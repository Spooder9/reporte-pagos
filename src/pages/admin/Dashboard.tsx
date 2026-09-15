import React from 'react'
import { Link } from 'react-router-dom'
import { useDebts } from '../../hooks/useDebts'
import { useAllPayments } from '../../hooks/usePayments'
import { useProfiles } from '../../hooks/useProfiles'
import { formatCurrency } from '../../lib/calculations'
import { CreditCard, Users, DollarSign, TrendingUp, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function AdminDashboard() {
  const { debts, loading: loadingDebts } = useDebts()
  const { payments, loading: loadingPayments } = useAllPayments()
  const { profiles, loading: loadingProfiles } = useProfiles()

  if (loadingDebts || loadingPayments || loadingProfiles) return <LoadingSpinner />

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0)
  const totalDebt = debts.reduce((s, d) => s + d.total_amount, 0)
  const totalPending = totalDebt - totalCollected
  const userCount = profiles.filter(p => p.role === 'user').length

  const recentPayments = payments.slice(0, 5)

  const stats = [
    { label: 'Total Deudas', value: debts.length.toString(), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50', sub: `${debts.filter(d => d.status === 'active').length} activas` },
    { label: 'Usuarios', value: userCount.toString(), icon: Users, color: 'text-gray-600', bg: 'bg-gray-100', sub: 'agentes registrados' },
    { label: 'Recaudado', value: formatCurrency(totalCollected), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', sub: 'total pagado' },
    { label: 'Pendiente', value: formatCurrency(totalPending), icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', sub: 'por cobrar' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-600 text-sm font-medium">{s.label}</p>
              <p className="text-gray-400 text-xs">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Deudas Activas</h2>
            <Link to="/todas-las-deudas" className="text-red-600 text-sm hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {debts.slice(0, 5).map(d => {
              const paid = payments.filter(p => p.debt_id === d.id).reduce((s, p) => s + p.amount, 0)
              const pct = d.total_amount > 0 ? Math.round((paid / d.total_amount) * 100) : 0
              return (
                <div key={d.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.description}</p>
                      <p className="text-xs font-mono text-gray-400">{d.code}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">{formatCurrency(d.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={pct} />
                    <span className="text-xs text-gray-500 w-8 flex-shrink-0">{pct}%</span>
                  </div>
                </div>
              )
            })}
            {debts.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No hay deudas registradas</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Pagos Recientes</h2>
            <Link to="/reportes" className="text-red-600 text-sm hover:underline font-medium">Ver reporte</Link>
          </div>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No hay pagos registrados</p>
            ) : recentPayments.map(p => {
              const debt = debts.find(d => d.id === p.debt_id)
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.profile?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{debt?.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-gray-400">{p.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
