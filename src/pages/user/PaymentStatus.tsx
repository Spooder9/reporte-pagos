import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { CheckCircle, XCircle, Clock, CreditCard, Car } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface MyPayment {
  id: string
  type: 'credit' | 'rental'
  amount: number
  date: string
  receipt_number: string
  comment: string | null
  period_label?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at: string
  reference: string
  reference_code: string
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
      <CheckCircle className="w-3 h-3" /> Aprobado
    </span>
  )
  if (status === 'rejected') return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
      <XCircle className="w-3 h-3" /> Rechazado
    </span>
  )
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
      <Clock className="w-3 h-3" /> En revisión
    </span>
  )
}

export default function PaymentStatus() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<MyPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetch = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const [{ data: cp }, { data: rp }] = await Promise.all([
      supabase.from('payments').select('*, debt:debts(description, code)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('rental_payments').select('*, rental:rentals(name, code)').eq('user_id', profile.id).order('created_at', { ascending: false }),
    ])

    const credits: MyPayment[] = (cp ?? []).map((p: any) => ({
      id: p.id, type: 'credit', amount: p.amount, date: p.date,
      receipt_number: p.receipt_number, comment: p.comment,
      status: p.status, rejection_reason: p.rejection_reason,
      created_at: p.created_at,
      reference: p.debt?.description ?? '—', reference_code: p.debt?.code ?? '—',
    }))

    const rentals: MyPayment[] = (rp ?? []).map((p: any) => ({
      id: p.id, type: 'rental', amount: p.amount, date: p.date,
      receipt_number: p.receipt_number, comment: p.comment,
      period_label: p.period_label, status: p.status,
      rejection_reason: p.rejection_reason, created_at: p.created_at,
      reference: p.rental?.name ?? '—', reference_code: p.rental?.code ?? '—',
    }))

    const all = [...credits, ...rentals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setPayments(all)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { fetch() }, [fetch])

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const pending = payments.filter(p => p.status === 'pending').length
  const approved = payments.filter(p => p.status === 'approved').length
  const rejected = payments.filter(p => p.status === 'rejected').length

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estado de mis Pagos</h1>
        <p className="text-gray-500 text-sm mt-1">Seguimiento de todos tus reportes de pago</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aprobados', value: approved, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
          { label: 'En revisión', value: pending, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
          { label: 'Rechazados', value: rejected, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtro tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'pending', label: 'En revisión' },
          { value: 'approved', label: 'Aprobados' },
          { value: 'rejected', label: 'Rechazados' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400">No hay pagos en esta categoría</p>
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className={`card border-l-4 ${
            p.status === 'approved' ? 'border-l-green-500' :
            p.status === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-400'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.type === 'credit' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  {p.type === 'credit' ? <CreditCard className="w-4 h-4 text-blue-600" /> : <Car className="w-4 h-4 text-orange-600" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.reference}</p>
                  <p className="text-xs font-mono text-gray-400">{p.reference_code}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{p.date}</span>
                    <span className="font-mono">{p.receipt_number}</span>
                    {p.period_label && <span>· {p.period_label}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                <StatusBadge status={p.status} />
              </div>
            </div>
            {p.comment && (
              <p className="text-xs text-gray-500 mt-2 pl-12 italic">"{p.comment}"</p>
            )}
            {p.rejection_reason && (
              <div className="mt-2 pl-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                  <span className="font-semibold">Motivo del rechazo:</span> {p.rejection_reason}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
