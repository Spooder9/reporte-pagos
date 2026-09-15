import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUserDebts } from '../../hooks/useDebts'
import { usePayments } from '../../hooks/usePayments'
import { formatCurrency } from '../../lib/calculations'
import { CreditCard, Percent, Calendar, Users, TrendingDown } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function MyDebts() {
  const { profile } = useAuth()
  const { debts, loading } = useUserDebts(profile?.id)
  const { payments } = usePayments(undefined, profile?.id)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Deudas</h1>
        <p className="text-gray-500 text-sm mt-1">{debts.length} créditos asignados</p>
      </div>

      {debts.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tienes deudas asignadas</p>
        </div>
      ) : debts.map(debt => {
        const myShare = debt.debt_members?.find(m => m.user_id === profile?.id)?.share ?? 0
        const myTotal = debt.total_amount * myShare / 100
        const myPaid = payments.filter(p => p.debt_id === debt.id).reduce((s, p) => s + p.amount, 0)
        const pct = myTotal > 0 ? Math.round((myPaid / myTotal) * 100) : 0
        const myPayments = payments.filter(p => p.debt_id === debt.id)
        const others = debt.debt_members?.filter(m => m.user_id !== profile?.id) ?? []

        return (
          <div key={debt.id} className="card space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded mb-2 inline-block">{debt.code}</span>
                <h3 className="text-lg font-semibold text-gray-800">{debt.description}</h3>
                {debt.product && <p className="text-sm text-gray-500">Producto: {debt.product}</p>}
              </div>
              <span className={debt.status === 'active' ? 'badge-active' : 'badge-overdue'}>
                {debt.status === 'active' ? 'Activa' : 'Vencida'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tasa anual', value: `${debt.interest_rate}%`, icon: Percent },
                { label: 'Plazo', value: `${debt.months} meses`, icon: Calendar },
                { label: 'Cuota mensual', value: formatCurrency(debt.monthly_payment), icon: TrendingDown },
                { label: 'Mi participación', value: `${myShare}%`, icon: Users },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <item.icon className="w-4 h-4 text-red-500 mb-1" />
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {debt.interest_description && (
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                <span className="font-medium">Intereses: </span>{debt.interest_description}
              </div>
            )}

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Mi progreso de pago</span>
                <span className="font-bold text-red-600">{pct}%</span>
              </div>
              <ProgressBar value={pct} />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Mi deuda: {formatCurrency(myTotal)}</span>
                <span>Pendiente: {formatCurrency(Math.max(0, myTotal - myPaid))}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Capital</p>
                <p className="text-base font-bold text-gray-800">{formatCurrency(debt.amount * myShare / 100)}</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-xs text-gray-500">Intereses</p>
                <p className="text-base font-bold text-gray-800">{formatCurrency(debt.total_interest * myShare / 100)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total a pagar</p>
                <p className="text-base font-bold text-red-600">{formatCurrency(myTotal)}</p>
              </div>
            </div>

            {others.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Co-deudores</p>
                <div className="flex flex-wrap gap-2">
                  {others.map(m => (
                    <span key={m.user_id} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {m.profile?.name} ({m.share}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {myPayments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Mis pagos recientes</p>
                <div className="space-y-2">
                  {myPayments.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-gray-700">{p.date}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-500 font-mono text-xs">{p.receipt_number}</span>
                        {p.comment && <p className="text-xs text-gray-400 mt-0.5">{p.comment}</p>}
                      </div>
                      <span className="font-bold text-green-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
