import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserDebts } from '../../hooks/useDebts'
import { usePayments } from '../../hooks/usePayments'
import { formatCurrency } from '../../lib/calculations'
import { CreditCard, CheckCircle, Clock } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function UserDashboard() {
  const { profile } = useAuth()
  const { debts, loading } = useUserDebts(profile?.id)
  const { payments } = usePayments(undefined, profile?.id)

  if (loading) return <LoadingSpinner />

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const totalOwed = debts.reduce((d, debt) => {
    const share = debt.debt_members?.find(m => m.user_id === profile?.id)?.share ?? 0
    return d + (debt.total_amount * share / 100)
  }, 0)

  const stats = [
    { label: 'Mis Créditos', value: debts.length.toString(), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Pagado', value: formatCurrency(totalPaid), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Saldo Pendiente', value: formatCurrency(Math.max(0, totalOwed - totalPaid)), icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
  ]

  const recentPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {profile?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tus créditos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Mis Créditos Activos</h2>
          <Link to="/mis-deudas" className="text-red-600 text-sm hover:underline font-medium">Ver todos</Link>
        </div>
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No tienes créditos asignados</p>
          </div>
        ) : debts.map(debt => {
          const myShare = debt.debt_members?.find(m => m.user_id === profile?.id)?.share ?? 0
          const myTotal = debt.total_amount * myShare / 100
          const myPaid = payments.filter(p => p.debt_id === debt.id).reduce((s, p) => s + p.amount, 0)
          const pct = myTotal > 0 ? Math.round((myPaid / myTotal) * 100) : 0
          return (
            <div key={debt.id} className="border border-gray-100 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <p className="font-medium text-gray-800">{debt.description}</p>
                  <p className="text-xs font-mono text-gray-400">{debt.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(debt.monthly_payment)}/mes</p>
                  <p className="text-xs text-gray-400">{myShare}% mi parte</p>
                </div>
              </div>
              <ProgressBar value={pct} />
              <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                <span>Pagado: {formatCurrency(myPaid)}</span>
                <span>Pendiente: {formatCurrency(Math.max(0, myTotal - myPaid))}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Últimos Pagos</h2>
          <Link to="/reportar-pago" className="btn-primary text-sm py-1.5 px-3">Reportar pago</Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No hay pagos registrados</p>
        ) : recentPayments.map(p => {
          const debt = debts.find(d => d.id === p.debt_id)
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{debt?.description ?? 'Pago'}</p>
                <p className="text-xs text-gray-400">{p.date} · {p.receipt_number}</p>
              </div>
              <span className="text-sm font-bold text-green-700 flex-shrink-0">{formatCurrency(p.amount)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
