import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePendingApprovals, PendingPayment } from '../../hooks/usePendingApprovals'
import { formatCurrency } from '../../lib/calculations'
import { CheckCircle, XCircle, Clock, CreditCard, Car, ChevronDown, ChevronUp } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

function RejectModal({ item, onConfirm, onCancel }: {
  item: PendingPayment
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Rechazar pago</h3>
        <p className="text-gray-500 text-sm mb-4">
          ¿Por qué rechazas el pago de <strong>{item.profile?.name}</strong> por <strong>{formatCurrency(item.amount)}</strong>?
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Motivo del rechazo (ej: comprobante inválido, monto incorrecto...)"
          rows={3}
          className="input-field resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="btn-primary flex-1 bg-red-600 disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function PaymentCard({ item, onApprove, onReject }: {
  item: PendingPayment
  onApprove: () => void
  onReject: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isCredit = item.type === 'credit'

  return (
    <div className="card border-l-4 border-l-yellow-400">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-blue-50' : 'bg-orange-50'}`}>
            {isCredit ? <CreditCard className="w-5 h-5 text-blue-600" /> : <Car className="w-5 h-5 text-orange-600" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isCredit ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {isCredit ? 'Crédito' : 'Alquiler'}
              </span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pendiente
              </span>
            </div>
            <p className="font-semibold text-gray-800">
              {isCredit ? item.debt_description : item.rental_name}
            </p>
            <p className="text-xs font-mono text-gray-400">
              {isCredit ? item.debt_code : item.rental_code}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-gray-900">{formatCurrency(item.amount)}</p>
          <p className="text-xs text-gray-400">{item.date}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-500">Conductor / Usuario</p>
            <p className="text-sm font-semibold text-gray-800">{item.profile?.name}</p>
            <p className="text-xs text-gray-400">{item.profile?.email}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-500">Comprobante</p>
            <p className="text-sm font-semibold text-gray-800 font-mono">{item.receipt_number}</p>
          </div>
          {item.period_label && (
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">Período</p>
              <p className="text-sm font-semibold text-gray-800">{item.period_label}</p>
            </div>
          )}
        </div>

        {item.comment && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar' : 'Ver'} comentario
          </button>
        )}
        {expanded && item.comment && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
            "{item.comment}"
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          Reportado el {new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Aprobar pago
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold py-2.5 px-4 rounded-xl transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Rechazar
        </button>
      </div>
    </div>
  )
}

export default function Approvals() {
  const { profile } = useAuth()
  const { items, loading, approve, reject } = usePendingApprovals()
  const [rejectTarget, setRejectTarget] = useState<PendingPayment | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState('')

  const handleApprove = async (item: PendingPayment) => {
    setProcessing(item.id)
    await approve(item, profile!.id)
    setProcessing(null)
    setDoneMessage(`Pago de ${item.profile?.name} aprobado correctamente`)
    setTimeout(() => setDoneMessage(''), 3000)
  }

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return
    setProcessing(rejectTarget.id)
    await reject(rejectTarget, profile!.id, reason)
    setRejectTarget(null)
    setProcessing(null)
    setDoneMessage(`Pago rechazado`)
    setTimeout(() => setDoneMessage(''), 3000)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobaciones Pendientes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {items.length === 0 ? 'No hay pagos pendientes' : `${items.length} pago${items.length > 1 ? 's' : ''} esperando aprobación`}
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
          <p className="text-gray-400 text-sm mt-1">No hay pagos esperando aprobación</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className={processing === item.id ? 'opacity-50 pointer-events-none' : ''}>
              <PaymentCard
                item={item}
                onApprove={() => handleApprove(item)}
                onReject={() => setRejectTarget(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
