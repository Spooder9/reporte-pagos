import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'
import { calculateMonthlyPayment, calculateTotalAmount, calculateTotalInterest, formatCurrency } from '../../lib/calculations'
import { Plus, Trash2, Calculator, CheckCircle, AlertCircle } from 'lucide-react'

export default function DebtCreate() {
  const { profile } = useAuth()
  const { profiles } = useProfiles()
  const users = profiles.filter(p => p.role === 'user')

  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '', description: '', product: '', amount: '', interest_rate: '',
    months: '', start_date: new Date().toISOString().split('T')[0], interest_description: '',
    managed_by: '',
  })
  const [members, setMembers] = useState([{ userId: '', share: '100' }])

  const amount = parseFloat(form.amount) || 0
  const rate = form.interest_rate === '' ? -1 : parseFloat(form.interest_rate)
  const months = parseInt(form.months) || 0

  const monthly = amount > 0 && months > 0 && rate >= 0 ? calculateMonthlyPayment(amount, rate, months) : 0
  const totalInterest = monthly > 0 ? calculateTotalInterest(monthly, months, amount) : 0
  const totalAmount = monthly > 0 ? calculateTotalAmount(monthly, months) : 0
  const totalShare = members.reduce((s, m) => s + (parseFloat(m.share) || 0), 0)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code) e.code = 'Requerido'
    if (!form.description) e.description = 'Requerido'
    if (!form.amount || amount <= 0) e.amount = 'Debe ser mayor a 0'
    if (form.interest_rate === '' || rate < 0) e.interest_rate = 'La tasa es requerida (puede ser 0%)'
    if (!form.months || months <= 0) e.months = 'Debe ser mayor a 0'
    if (!form.start_date) e.start_date = 'Requerido'
    if (members.some(m => !m.userId)) e.members = 'Selecciona todos los usuarios'
    if (Math.abs(totalShare - 100) > 0.01) e.share = 'Los porcentajes deben sumar 100%'
    const ids = new Set(members.map(m => m.userId))
    if (ids.size < members.length) e.members = 'No puedes repetir el mismo usuario'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)

    const { data: debt, error: debtErr } = await supabase.from('debts').insert({
      code: form.code, description: form.description,
      product: form.product || null,
      amount, interest_rate: rate, months,
      monthly_payment: monthly, total_interest: totalInterest,
      total_amount: totalAmount, start_date: form.start_date,
      interest_description: form.interest_description || null,
      created_by: profile?.id ?? null, status: 'active',
      managed_by: form.managed_by || null,
    }).select().single()

    if (debtErr || !debt) {
      setErrors({ submit: debtErr?.message ?? 'Error al crear la deuda' })
      setSaving(false)
      return
    }

    const membersData = members.map(m => ({
      debt_id: debt.id, user_id: m.userId, share: parseFloat(m.share),
    }))
    await supabase.from('debt_members').insert(membersData)

    setSuccess(true)
    setForm({ code: '', description: '', product: '', amount: '', interest_rate: '', months: '', start_date: new Date().toISOString().split('T')[0], interest_description: '', managed_by: '' })
    setMembers([{ userId: '', share: '100' }])
    setSaving(false)
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Deuda</h1>
        <p className="text-gray-500 text-sm mt-1">Registra un nuevo crédito en el sistema</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Deuda creada exitosamente</span>
        </div>
      )}
      {errors.submit && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-100">Información del crédito</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código / ID *</label>
              <input value={form.code} onChange={set('code')} placeholder="CRED-2024-001" className="input-field" />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Producto / Referencia</label>
              <input value={form.product} onChange={set('product')} placeholder="Nevera Samsung 400L" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Descripción del crédito..." className="input-field resize-none" />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción de intereses</label>
            <input value={form.interest_description} onChange={set('interest_description')} placeholder="Ej: Tasa nominal anual del 12%, pagadera mensualmente" className="input-field" />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-100">Parámetros financieros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto ($) *</label>
              <input type="number" value={form.amount} onChange={set('amount')} placeholder="0" min="0" step="1000" className="input-field" />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tasa anual (%) *</label>
              <input type="number" value={form.interest_rate} onChange={set('interest_rate')} placeholder="0" min="0" max="100" step="0.1" className="input-field" />
              {errors.interest_rate && <p className="text-red-500 text-xs mt-1">{errors.interest_rate}</p>}
              {form.interest_rate === '0' && <p className="text-blue-500 text-xs mt-1">Sin intereses — cuota fija</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Plazo (meses) *</label>
              <input type="number" value={form.months} onChange={set('months')} placeholder="12" min="1" max="360" className="input-field" />
              {errors.months && <p className="text-red-500 text-xs mt-1">{errors.months}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio *</label>
            <input type="date" value={form.start_date} onChange={set('start_date')} className="input-field" />
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
          </div>

          {monthly > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-gray-700">Resumen calculado</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cuota mensual</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(monthly)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total intereses</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(totalInterest)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total a pagar</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Deudores asignados</h2>
            <button type="button" onClick={() => setMembers([...members, { userId: '', share: '0' }])}
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          {members.map((m, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario {i + 1}</label>
                <select value={m.userId} onChange={e => setMembers(members.map((x, j) => j === i ? { ...x, userId: e.target.value } : x))} className="input-field">
                  <option value="">Seleccionar usuario...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Porcentaje %</label>
                <input type="number" value={m.share} min="0" max="100"
                  onChange={e => setMembers(members.map((x, j) => j === i ? { ...x, share: e.target.value } : x))}
                  className="input-field" />
              </div>
              {members.length > 1 && (
                <button type="button" onClick={() => setMembers(members.filter((_, j) => j !== i))}
                  className="mb-0.5 p-2.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <div className={`flex items-center gap-2 text-sm font-medium ${Math.abs(totalShare - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
            Total: {totalShare}% {Math.abs(totalShare - 100) < 0.01 ? '✓' : '(debe ser 100%)'}
          </div>
          {errors.members && <p className="text-red-500 text-xs">{errors.members}</p>}
          {errors.share && <p className="text-red-500 text-xs">{errors.share}</p>}
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-100">Gestor asignado</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Empleado responsable de esta deuda</label>
            <select
              value={form.managed_by}
              onChange={e => setForm(f => ({ ...f, managed_by: e.target.value }))}
              className="input-field"
            >
              <option value="">Sin gestor asignado (solo admin)</option>
              {profiles.filter(p => p.role === 'empleado').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">El gestor podrá ver y aprobar pagos de esta deuda</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : 'Crear Deuda'}
        </button>
      </form>
    </div>
  )
}
