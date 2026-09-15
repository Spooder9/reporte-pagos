import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRentals } from '../../hooks/useRentals'
import { useRentalPayments } from '../../hooks/useRentalPayments'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { Car, Bike, Package, Plus, X, CheckCircle, AlertCircle, Edit2, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

const VEHICLE_ICONS = { car: Car, motorcycle: Bike, other: Package }
const VEHICLE_LABELS = { car: 'Carro', motorcycle: 'Moto', other: 'Otro' }
const PERIOD_LABELS = { daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual' }

export default function RentalManagement() {
  const { profile } = useAuth()
  const { rentals, loading, refetch } = useRentals()
  const { payments: allPayments } = useRentalPayments()
  const { profiles } = useProfiles()
  const users = profiles.filter(p => p.role === 'user')

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    vehicle_type: 'car' as 'car' | 'motorcycle' | 'other',
    plate: '',
    description: '',
    reference_rate: '',
    rate_period: 'weekly' as 'daily' | 'weekly' | 'monthly',
    assigned_to: '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code) e.code = 'Requerido'
    if (!form.name) e.name = 'Requerido'
    if (!form.assigned_to) e.assigned_to = 'Debes asignar un conductor'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)

    const { error } = await supabase.from('rentals').insert({
      code: form.code,
      name: form.name,
      vehicle_type: form.vehicle_type,
      plate: form.plate || null,
      description: form.description || null,
      reference_rate: form.reference_rate ? parseFloat(form.reference_rate) : null,
      rate_period: form.rate_period,
      assigned_to: form.assigned_to,
      created_by: profile?.id ?? null,
      status: 'active',
    })

    setSaving(false)
    if (error) { setErrors({ submit: error.message }); return }

    setSuccess('Vehículo registrado exitosamente')
    setForm({ code: '', name: '', vehicle_type: 'car', plate: '', description: '', reference_rate: '', rate_period: 'weekly', assigned_to: '' })
    setShowForm(false)
    refetch()
    setTimeout(() => setSuccess(''), 3000)
  }

  const toggleStatus = async (id: string, current: string) => {
    await supabase.from('rentals').update({ status: current === 'active' ? 'inactive' : 'active' }).eq('id', id)
    refetch()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehículos en Alquiler</h1>
          <p className="text-gray-500 text-sm mt-1">{rentals.length} vehículos registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nuevo vehículo'}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Registrar vehículo</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de vehículo</label>
                <select value={form.vehicle_type} onChange={set('vehicle_type')} className="input-field">
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Código *</label>
                <input value={form.code} onChange={set('code')} placeholder="VEH-001" className="input-field" />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Placa</label>
                <input value={form.plate} onChange={set('plate')} placeholder="ABC-123" className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre / Descripción del vehículo *</label>
              <input value={form.name} onChange={set('name')} placeholder="Toyota Corolla 2020 blanco" className="input-field" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas adicionales</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Condiciones del acuerdo, observaciones..." className="input-field resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tarifa de referencia ($)</label>
                <input type="number" value={form.reference_rate} onChange={set('reference_rate')} placeholder="0" min="0" step="1000" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Período de tarifa</label>
                <select value={form.rate_period} onChange={set('rate_period')} className="input-field">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Conductor asignado *</label>
                <select value={form.assigned_to} onChange={set('assigned_to')} className="input-field">
                  <option value="">Seleccionar conductor...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                {errors.assigned_to && <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>}
              </div>
            </div>

            {errors.submit && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Registrar vehículo
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de vehículos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rentals.length === 0 ? (
          <div className="card text-center py-12 col-span-2">
            <Car className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay vehículos registrados</p>
          </div>
        ) : rentals.map(rental => {
          const Icon = VEHICLE_ICONS[rental.vehicle_type]
          const vehiclePayments = allPayments.filter(p => p.rental_id === rental.id)
          const totalProduced = vehiclePayments.reduce((s, p) => s + p.amount, 0)
          const lastPayment = vehiclePayments[0]
          return (
            <div key={rental.id} className={`card border-l-4 ${rental.status === 'active' ? 'border-l-red-500' : 'border-l-gray-300'}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${rental.status === 'active' ? 'bg-red-50' : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${rental.status === 'active' ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{rental.name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{rental.code}</span>
                      {rental.plate && <span className="text-xs text-gray-500">Placa: <strong>{rental.plate}</strong></span>}
                      <span className="text-xs text-gray-400">{VEHICLE_LABELS[rental.vehicle_type]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={rental.status === 'active' ? 'badge-active' : 'badge-overdue'}>
                    {rental.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => toggleStatus(rental.id, rental.status)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    {rental.status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Conductor</p>
                  <p className="text-sm font-semibold text-gray-800">{rental.assigned_profile?.name ?? '—'}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs text-gray-500">Total producido</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">{formatCurrency(totalProduced)}</p>
                  <p className="text-xs text-gray-400">{vehiclePayments.length} pagos</p>
                </div>
              </div>

              {rental.reference_rate && (
                <p className="text-xs text-gray-500 mb-2">
                  Tarifa referencia: <span className="font-semibold">{formatCurrency(rental.reference_rate)}</span> {PERIOD_LABELS[rental.rate_period].toLowerCase()}
                </p>
              )}

              {rental.description && (
                <p className="text-xs text-gray-400 italic mb-2">{rental.description}</p>
              )}

              {lastPayment && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>Último pago: <strong>{lastPayment.date}</strong></span>
                  <span className="font-semibold text-green-600">{formatCurrency(lastPayment.amount)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
