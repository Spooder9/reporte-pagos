import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { CreditCard, Users, Percent, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'

export default function ManagedDebts() {
  const { profile } = useAuth()
  const [debts, setDebts] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    async function load() {
      const { data: d } = await supabase
        .from('debts')
        .select('*, debt_members(*, profile:profiles(*))')
        .eq('managed_by', profile!.id)
        .order('created_at', { ascending: false })
      const debtIds = (d ?? []).map((x: any) => x.id)
      let pays: any[] = []
      if (debtIds.length > 0) {
        const { data: p } = await supabase
          .from('payments')
          .select('*')
          .in('debt_id', debtIds)
          .eq('status', 'approved')
        pays = p ?? []
      }
      setDebts(d ?? [])
      setPayments(pays)
      setLoading(false)
    }
    load()
  }, [profile?.id])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deudas bajo mi Gestión</h1>
        <p className="text-gray-500 text-sm mt-1">{debts.length} créditos asignados a ti</p>
      </div>

      {debts.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tienes deudas asignadas</p>
          <p className="text-gray-400 text-sm mt-1">El administrador debe asignarte deudas</p>
        </div>
      ) : debts.map((debt: any) => {
        const approved = payments.filter((p: any) => p.debt_id === debt.id).reduce((s: number, p: any) => s + p.amount, 0)
        const pct = debt.total_amount > 0 ? Math.round((approved / debt.total_amount) * 100) : 0
        return (
          <div key={debt.id} className="card space-y-4">
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
                { label: 'Capital', value: formatCurrency(debt.amount), icon: CreditCard },
                { label: 'Tasa anual', value: `${debt.interest_rate}%`, icon: Percent },
                { label: 'Plazo', value: `${debt.months} meses`, icon: Calendar },
                { label: 'Cuota', value: formatCurrency(debt.monthly_payment), icon: Users },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <item.icon className="w-4 h-4 text-red-500 mb-1" />
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso de cobro</span>
                <span className="font-bold">{pct}%</span>
              </div>
              <ProgressBar value={pct} />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Cobrado: {formatCurrency(approved)}</span>
                <span>Pendiente: {formatCurrency(Math.max(0, debt.total_amount - approved))}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Deudores</p>
              <div className="flex flex-wrap gap-2">
                {debt.debt_members?.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold">
                      {m.profile?.name?.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{m.profile?.name}</span>
                    <span className="text-xs text-gray-400">({m.share}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
