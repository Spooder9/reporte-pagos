import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { CheckCircle, XCircle, Clock, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface PendingItem {
  id: string
  user_id: string
  debt_id: string
  amount: number
  date: string
  receipt_number: string
  comment: string | null
  created_at: string
  profile: any
  debt: any
}

function RejectModal({ item, onConfirm, onCancel }: { item: PendingItem; onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Rechazar pago</h3>
        <p className="text-gray-500 text-sm mb-4">
          ¿Por qué rechazas el pago de <strong>{item.profile?.name}</strong> por <strong>{formatCurrency(item.amount)}</strong>?
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder="Motivo del rechazo..." className="input-field resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            className="btn-primary flex-1 disabled:opacity-50">Confirmar rechazo</button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function EmpleadoApprovals() {
  const { profile } = useAuth()
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<PendingItem | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    // Get debts managed by this employee
    const { data: myDebts } = await supabase.from('debts').select('id').eq('managed_by', profile.id)
    const myDebtIds = (myDebts ?? []).map((d: any) => d.id)
    if (myDebtIds.length === 0) { setItems([]); setLoading(false); return }

    const { data } = await supabase
      .from('payments')
      .select('*, profile:profiles(*), debt:debts(description, code)')
      .eq('status', 'pending')
      .in('debt_id', myDebtIds)
      .order('created_at', { ascending: false })
    setItems((data ?? []) as PendingItem[])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  const approve = async (item: PendingItem) => {
    setProcessing(item.id)
    await supabase.from('payments').update({
      status: 'approved', reviewed_by: profile!.id, reviewed_at: new Date().toISOString()
    } as any).eq('id', item.id)
    setProcessing(null)
    setDoneMessage(`Pago de ${item.profile?.name} aprobado`)
    load()
    setTimeout(() => setDoneMessage(''), 3000)
  }

  const reject = async (reason: string) => {
    if (!rejectTarget) return
    setProcessing(rejectTarget.id)
    await supabase.from('payments').update({
      status: 'rejected', reviewed_by: profile!.id,
      reviewed_at: new Date().toISOString(), rejection_reason: reason
    } as any).eq('id', rejectTarget.id)
    setRejectTarget(null)
    setProcessing(null)
    setDoneMessage('Pago rechazado')
    load()
    setTimeout(() => setDoneMessage(''), 3000)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {rejectTarget && <RejectModal item={rejectTarget} onConfirm={reject} onCancel={() => setRejectTarget(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobar Pagos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {items.length === 0 ? 'No hay pagos pendientes' : `${items.length} pago${items.length > 1 ? 's' : ''} esperando tu aprobación`}
        </p>
      </div>

      {doneMessage && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{doneMessage}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Todo al día</p>
          <p className="text-gray-400 text-sm mt-1">No hay pagos pendientes en tus deudas</p>
        </div>
      ) : items.map(item => (
        <div key={item.id} className={`card border-l-4 border-l-yellow-400 ${processing === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit mb-1">
                  <Clock className="w-3 h-3" /> Pendiente
                </span>
                <p className="font-semibold text-gray-800">{item.debt?.description}</p>
                <p className="text-xs font-mono text-gray-400">{item.debt?.code}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-gray-900">{formatCurrency(item.amount)}</p>
              <p className="text-xs text-gray-400">{item.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">Usuario</p>
              <p className="text-sm font-semibold text-gray-800">{item.profile?.name}</p>
              <p className="text-xs text-gray-400">{item.profile?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">Comprobante</p>
              <p className="text-sm font-semibold font-mono text-gray-800">{item.receipt_number}</p>
            </div>
          </div>

          {item.comment && (
            <>
              <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2">
                {expanded === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded === item.id ? 'Ocultar' : 'Ver'} comentario
              </button>
              {expanded === item.id && (
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">"{item.comment}"</p>
              )}
            </>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Reportado: {new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => approve(item)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
              <CheckCircle className="w-4 h-4" /> Aprobar
            </button>
            <button onClick={() => setRejectTarget(item)}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold py-2.5 px-4 rounded-xl transition-colors">
              <XCircle className="w-4 h-4" /> Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
