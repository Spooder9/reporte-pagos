import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KeyRound, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user arrives via the recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Elige una contraseña segura</p>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold text-gray-800">¡Contraseña actualizada!</p>
              <p className="text-sm text-gray-500">Serás redirigido al inicio de sesión...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
              <p className="text-gray-500 text-sm">Verificando enlace de recuperación...</p>
              <p className="text-gray-400 text-xs">Si esto tarda mucho, el enlace puede haber expirado.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña *</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="input-field"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
