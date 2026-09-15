import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { CreditCard, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function EmpleadoDashboard() {
  const { profile } = useAuth()
  const [debts, setDebts] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    async function load() {
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from('debts').select('*, debt_members(*, profile:profiles(*))').eq('managed_by', profile!.id).eq('status', 'active'),
        supabase.from('payments').select('*, profile:profiles(*), debt:debts(description, code)').eq('status', 'pending')
      ])
      // Filter pending payments to only debts managed by this employee
      const myDebtIds = (d ?? []).map((x: any) => x.id)
      const myPending = (p ?? []).filter((pay: any) => myDebtIds.includes(pay.debt_id))
      setDebts(d ?? [])
      setPendingPayments(myPending)
      setLoading(false)
    }
    load()
  }, [profile?.id])

  if (loading) return <LoadingSpinner />

  const totalCapital = debts.reduce((s: number, d: any) => s + d.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Panel de Gestión</h1>
        <p className="text-gray-500 text-sm mt-1">Deudas y pagos bajo tu responsabilidad</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{debts.length}</p>
            <p className="text-gray-500 text-sm">Deudas asignadas</p>
            <p className="text-gray-400 text-xs">{formatCurrency(totalCapital)} en capital</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{pendingPayments.length}</p>
            <p className="text-gray-500 text-sm">Pagos pendientes</p>
            <p className="text-gray-400 text-xs">esperando tu aprobación</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(pendingPayments.reduce((s: number, p: any) => s + p.amount, 0))}</p>
            <p className="text-gray-500 text-sm">Monto pendiente</p>
          </div>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="card border-l-4 border-l-yellow-400">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-800">Pagos que requieren tu aprobación</h2>
            </div>
            <Link to="/gestion-aprobaciones" className="text-red-600 text-sm hover:underline font-medium">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {pendingPayments.slice(0, 3).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{p.profile?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.debt?.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-gray-400">{p.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Mis Deudas Asignadas</h2>
          <Link to="/gestion-deudas" className="text-red-600 text-sm hover:underline font-medium">Ver detalle</Link>
        </div>
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No tienes deudas asignadas</p>
          </div>
        ) : debts.map((debt: any) => {
          const memberNames = debt.debt_members?.map((m: any) => m.profile?.name).filter(Boolean).join(', ')
          return (
            <div key={debt.id} className="border border-gray-100 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <p className="font-medium text-gray-800">{debt.description}</p>
                  <p className="text-xs font-mono text-gray-400">{debt.code}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Deudores: {memberNames}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(debt.monthly_payment)}/mes</p>
                  <p className="text-xs text-gray-400">{debt.months} meses</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
