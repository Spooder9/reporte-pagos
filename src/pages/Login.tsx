import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { CreditCard, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) setError('Correo o contraseña incorrectos. Verifica tus datos.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-2xl mb-4">
          <CreditCard className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">ReportePagos</h1>
        <p className="text-gray-400 mt-2 text-sm">Sistema de gestión de créditos y deudas</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-gray-400 text-sm mb-6">Ingresa a tu cuenta</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Iniciando sesión...</> : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3 font-medium">Cuentas de demostración</p>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="font-semibold text-red-600">Admin</span>
              <span>admin@demo.com / admin123</span>
            </div>
            <div className="flex justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="font-semibold text-gray-600">Usuario</span>
              <span>juan@demo.com / user123</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-gray-600 text-xs">© 2024 ReportePagos · Todos los derechos reservados</p>
    </div>
  )
}
