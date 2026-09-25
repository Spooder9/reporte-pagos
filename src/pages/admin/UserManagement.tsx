import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfiles } from '../../hooks/useProfiles'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, Plus, X, Loader2, Pencil, Save } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

type Role = 'admin' | 'empleado' | 'user'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin',    label: 'Admin' },
  { value: 'empleado', label: 'Empleado' },
  { value: 'user',     label: 'Miembro' },
]

function roleBadgeClass(role: string) {
  if (role === 'admin')    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
  if (role === 'empleado') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

function roleLabel(role: string) {
  if (role === 'admin')    return 'Admin'
  if (role === 'empleado') return 'Empleado'
  return 'Miembro'
}

function avatarColor(role: string) {
  if (role === 'admin')    return 'bg-red-600'
  if (role === 'empleado') return 'bg-blue-500'
  return 'bg-gray-500'
}

export default function UserManagement() {
  const { profile: me } = useAuth()
  const { profiles, loading, refetch } = useProfiles()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Role editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<Role>('user')
  const [savingRole, setSavingRole] = useState(false)

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
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, role: 'user' } },
    })

    if (error) {
      setErrors({ submit: error.message })
      setSaving(false)
      return
    }

    if (data.user?.id) {
      await supabase.rpc('admin_confirm_user', { user_id: data.user.id })
      if (form.phone) {
        await supabase.from('profiles').update({ phone: form.phone } as any).eq('id', data.user.id)
      }
    }

    setSuccess('Usuario creado exitosamente. Ya puede iniciar sesión.')
    setForm({ name: '', email: '', password: '', phone: '' })
    setShowForm(false)
    setSaving(false)
    setTimeout(() => refetch(), 1500)
    setTimeout(() => setSuccess(''), 5000)
  }

  const startEditRole = (id: string, currentRole: Role) => {
    setEditingId(id)
    setPendingRole(currentRole)
  }

  const cancelEditRole = () => {
    setEditingId(null)
  }

  const saveRole = async (id: string) => {
    setSavingRole(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: pendingRole } as any)
      .eq('id', id)

    setSavingRole(false)
    if (error) {
      alert('Error al actualizar el rol: ' + error.message)
      return
    }
    setEditingId(null)
    setSuccess('Rol actualizado correctamente.')
    setTimeout(() => setSuccess(''), 4000)
    refetch()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{profiles.length} usuarios registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nuevo usuario'}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Crear nuevo usuario</h2>
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
        {profiles.map(p => {
          const isEditing = editingId === p.id
          const isSelf = p.id === me?.id

          return (
            <div key={p.id} className="card flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${avatarColor(p.role)}`}>
                {p.name?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                    {isSelf && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">(tú)</span>
                    )}
                  </div>
                  {!isSelf && !isEditing && (
                    <button
                      onClick={() => startEditRole(p.id, p.role as Role)}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Cambiar rol"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role display / editor */}
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <select
                      value={pendingRole}
                      onChange={e => setPendingRole(e.target.value as Role)}
                      className="input-field text-sm py-1.5"
                    >
                      {ROLE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveRole(p.id)}
                        disabled={savingRole || pendingRole === p.role}
                        className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
                      >
                        {savingRole ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Guardar
                      </button>
                      <button onClick={cancelEditRole} className="btn-secondary text-xs py-1.5 px-3">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeClass(p.role)}`}>
                    {roleLabel(p.role)}
                  </span>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{p.email}</p>
                {p.phone && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.phone}</p>}
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Desde {p.created_at?.split('T')[0]}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
