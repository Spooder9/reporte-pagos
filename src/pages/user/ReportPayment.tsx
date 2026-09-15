import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUserDebts } from '../../hooks/useDebts'
import { usePayments } from '../../hooks/usePayments'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { CheckCircle, DollarSign, Loader2 } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ReportPayment() {
  const { profile } = useAuth()
  const { debts, loading } = useUserDebts(profile?.id)
  const { payments, refetch } = usePayments(undefined, profile?.id)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    debtId: '', amount: '', date: new Date().toISOString().split('T')[0],
    receiptNumber: '', comment: '',
  })

  const activeDebts = debts.filter(d => d.status === 'active')
  const selectedDebt = debts.find(d => d.id === form.debtId)
  const myShare = selectedDebt?.debt_members?.find(m => m.user_id === profile?.id)?.share ?? 0
  const myPaid = payments.filter(p => p.debt_id === form.debtId).reduce((s, p) => s + p.amount, 0)
  const myTotal = selectedDebt ? selectedDebt.total_amount * myShare / 100 : 0
  const myPending = Math.max(0, myTotal - myPaid)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.debtId) e.debtId = 'Selecciona un crédito'
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'El monto debe ser mayor a 0'
    if (!form.date) e.date = 'La fecha es requerida'
    if (!form.receiptNumber) e.receiptNumber = 'El número de comprobante es requerido'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)

    const { error } = await supabase.from('payments').insert({
      debt_id: form.debtId, user_id: profile!.id,
      amount: parseFloat(form.amount), date: form.date,
      receipt_number: form.receiptNumber,
      comment: form.comment || null,
    })

    setSaving(false)
    if (error) { setErrors({ submit: error.message }); return }

    setSuccess(true)
    setForm({ debtId: '', amount: '', date: new Date().toISOString().split('T')[0], receiptNumber: '', comment: '' })
    refetch()
    setTimeout(() => setSuccess(false), 4000)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportar Pago</h1>
        <p className="text-gray-500 text-sm mt-1">Registra un nuevo pago para uno de tus créditos</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Pago reportado exitosamente</span>
        </div>
      )}

      {activeDebts.length === 0 ? (
        <div className="card text-center py-10">
          <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-500">No tienes créditos activos para reportar pagos</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-100">Selecciona el crédito</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Crédito *</label>
              <select value={form.debtId} onChange={set('debtId')} className="input-field">
                <option value="">Seleccionar crédito...</option>
                {activeDebts.map(d => <option key={d.id} value={d.id}>{d.code} — {d.description}</option>)}
              </select>
              {errors.debtId && <p className="text-red-500 text-xs mt-1">{errors.debtId}</p>}
            </div>
            {selectedDebt && (
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500">Cuota mensual</p>
                  <p className="text-sm font-bold text-red-600">{formatCurrency(selectedDebt.monthly_payment)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mi saldo pendiente</p>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(myPending)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mi participación</p>
                  <p className="text-sm font-bold text-gray-800">{myShare}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-100">Detalles del pago</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto pagado ($) *</label>
                <input type="number" value={form.amount} onChange={set('amount')} placeholder="0" min="1" step="1000" className="input-field" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                {selectedDebt && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, amount: selectedDebt.monthly_payment.toFixed(0) }))}
                    className="text-xs text-red-600 hover:underline mt-1">
                    Usar cuota ({formatCurrency(selectedDebt.monthly_payment)})
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de pago *</label>
                <input type="date" value={form.date} onChange={set('date')} className="input-field" />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de comprobante *</label>
              <input value={form.receiptNumber} onChange={set('receiptNumber')} placeholder="REC-12345 o número de transacción" className="input-field" />
              {errors.receiptNumber && <p className="text-red-500 text-xs mt-1">{errors.receiptNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comentario (opcional)</label>
              <textarea value={form.comment} onChange={set('comment')} rows={2} placeholder="Notas sobre el pago..." className="input-field resize-none" />
            </div>
            {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />Guardando...</> : 'Reportar Pago'}
          </button>
        </form>
      )}
    </div>
  )
}
