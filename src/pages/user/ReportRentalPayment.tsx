import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUserRentals } from '../../hooks/useRentals'
import { useRentalPayments } from '../../hooks/useRentalPayments'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { CheckCircle, Car, Loader2 } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ReportRentalPayment() {
  const { profile } = useAuth()
  const { rentals, loading } = useUserRentals(profile?.id)
  const { payments, refetch } = useRentalPayments(undefined, profile?.id)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    rentalId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    periodLabel: '',
    receiptNumber: '',
    comment: '',
  })

  const selectedRental = rentals.find(r => r.id === form.rentalId)
  const vehiclePayments = payments.filter(p => p.rental_id === form.rentalId)
  const totalPaidThisVehicle = vehiclePayments.reduce((s, p) => s + p.amount, 0)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.rentalId) e.rentalId = 'Selecciona un vehículo'
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'El monto debe ser mayor a 0'
    if (!form.date) e.date = 'La fecha es requerida'
    if (!form.receiptNumber) e.receiptNumber = 'El comprobante es requerido'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)

    const { error } = await supabase.from('rental_payments').insert({
      rental_id: form.rentalId,
      user_id: profile!.id,
      amount: parseFloat(form.amount),
      date: form.date,
      period_label: form.periodLabel || null,
      receipt_number: form.receiptNumber,
      comment: form.comment || null,
    })

    setSaving(false)
    if (error) { setErrors({ submit: error.message }); return }

    setSuccess(true)
    setForm({ rentalId: '', amount: '', date: new Date().toISOString().split('T')[0], periodLabel: '', receiptNumber: '', comment: '' })
    refetch()
    setTimeout(() => setSuccess(false), 4000)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportar Pago de Alquiler</h1>
        <p className="text-gray-500 text-sm mt-1">Registra un pago por el uso del vehículo</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Pago reportado exitosamente</span>
        </div>
      )}

      {rentals.length === 0 ? (
        <div className="card text-center py-10">
          <Car className="w-12 h-12 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-500">No tienes vehículos activos asignados</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-100">Selecciona el vehículo</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehículo *</label>
              <select value={form.rentalId} onChange={set('rentalId')} className="input-field">
                <option value="">Seleccionar vehículo...</option>
                {rentals.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}{r.plate ? ` — ${r.plate}` : ''} ({r.code})
                  </option>
                ))}
              </select>
              {errors.rentalId && <p className="text-red-500 text-xs mt-1">{errors.rentalId}</p>}
            </div>

            {selectedRental && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Total pagado hasta hoy</p>
                    <p className="text-base font-bold text-red-600">{formatCurrency(totalPaidThisVehicle)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Número de pagos</p>
                    <p className="text-base font-bold text-gray-800">{vehiclePayments.length}</p>
                  </div>
                </div>
                {selectedRental.reference_rate && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Tarifa de referencia: <strong>{formatCurrency(selectedRental.reference_rate)}</strong> {selectedRental.rate_period === 'daily' ? 'diaria' : selectedRental.rate_period === 'weekly' ? 'semanal' : 'mensual'}
                  </p>
                )}
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
                {selectedRental?.reference_rate && (
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, amount: selectedRental.reference_rate!.toFixed(0) }))}
                    className="text-xs text-red-600 hover:underline mt-1">
                    Usar tarifa ref. ({formatCurrency(selectedRental.reference_rate)})
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Período cubierto</label>
              <input value={form.periodLabel} onChange={set('periodLabel')} placeholder="Ej: Semana del 15 al 21 de septiembre" className="input-field" />
              <p className="text-xs text-gray-400 mt-1">Opcional — describe el período que cubre este pago</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de comprobante *</label>
              <input value={form.receiptNumber} onChange={set('receiptNumber')} placeholder="REC-001 o número de transferencia" className="input-field" />
              {errors.receiptNumber && <p className="text-red-500 text-xs mt-1">{errors.receiptNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comentario (opcional)</label>
              <textarea value={form.comment} onChange={set('comment')} rows={2} placeholder="Notas adicionales..." className="input-field resize-none" />
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
