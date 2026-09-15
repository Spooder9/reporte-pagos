import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfiles } from '../../hooks/useProfiles'
import { CheckCircle, Plus, X, Loader2 } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function UserManagement() {
  const { profiles, loading, refetch } = useProfiles()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name) errs.name = 'Requerido'
    if (!form.email) errs.email = 'Requerido'
    if (!form.password || form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    const { error } = await supabase.auth.admin.createUser({
      email: form.email, password: form.password,
      user_metadata: { name: form.name, role: 'user' },
      email_confirm: true,
    })

    if (error) {
      setErrors({ submit: error.message })
      setSaving(false)
      return
    }

    // Update phone if provided
    if (form.phone) {
      // Will be handled by trigger, but we can update after
    }

    setSuccess('Usuario creado exitosamente')
    setForm({ name: '', email: '', password: '', phone: '' })
    setShowForm(false)
    setSaving(false)
    refetch()
    setTimeout(() => setSuccess(''), 3000)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{profiles.length} usuarios registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nuevo usuario'}
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
          <h2 className="text-base font-semibold text-gray-800 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
                <input value={form.name} onChange={set('name')} placeholder="Juan García" className="input-field" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="juan@email.com" className="input-field" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña *</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" className="input-field" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                <input value={form.phone} onChange={set('phone')} placeholder="3001234567" className="input-field" />
              </div>
            </div>
            {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear usuario
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map(p => (
          <div key={p.id} className="card flex items-start gap-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${p.role === 'admin' ? 'bg-red-600' : 'bg-gray-500'}`}>
              {p.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800">{p.name}</p>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.role === 'admin' ? 'Admin' : 'Usuario'}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{p.email}</p>
              {p.phone && <p className="text-xs text-gray-400 mt-0.5">{p.phone}</p>}
              <p className="text-xs text-gray-300 mt-1">Desde {p.created_at?.split('T')[0]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
