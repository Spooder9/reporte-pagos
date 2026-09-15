import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, CreditCard, Users, BarChart3, FileText,
  LogOut, Menu, X, Bell, CreditCard as CardIcon, PlusCircle,
  Car, TrendingUp, CheckCircle, Clock
} from 'lucide-react'
import { usePendingCount } from '../hooks/usePendingApprovals'

interface NavItem { to: string; label: string; icon: React.ElementType }
interface NavGroup { label: string; items: NavItem[] }

function PendingBadge() {
  const { count } = usePendingCount()
  if (count === 0) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const adminGroups: NavGroup[] = [
    {
      label: 'General',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/aprobaciones', label: 'Aprobaciones', icon: CheckCircle },
      ],
    },
    {
      label: 'Créditos',
      items: [
        { to: '/todas-las-deudas', label: 'Ver Deudas', icon: CreditCard },
        { to: '/crear-deuda', label: 'Crear Deuda', icon: PlusCircle },
        { to: '/reportes', label: 'Reportes', icon: BarChart3 },
        { to: '/historial-pagos', label: 'Historial Pagos', icon: FileText },
      ],
    },
    {
      label: 'Alquileres',
      items: [
        { to: '/alquileres', label: 'Vehículos', icon: Car },
        { to: '/reportes-alquileres', label: 'Reportes', icon: TrendingUp },
      ],
    },
    {
      label: 'Administración',
      items: [{ to: '/usuarios', label: 'Usuarios', icon: Users }],
    },
  ]

  const userGroups: NavGroup[] = [
    {
      label: 'General',
      items: [
        { to: '/dashboard', label: 'Mi Panel', icon: LayoutDashboard },
        { to: '/mis-pagos', label: 'Estado de Pagos', icon: Clock },
      ],
    },
    {
      label: 'Créditos',
      items: [
        { to: '/mis-deudas', label: 'Mis Deudas', icon: CreditCard },
        { to: '/reportar-pago', label: 'Reportar Pago', icon: FileText },
      ],
    },
    {
      label: 'Alquileres',
      items: [
        { to: '/mis-vehiculos', label: 'Mis Vehículos', icon: Car },
        { to: '/reportar-alquiler', label: 'Reportar Alquiler', icon: TrendingUp },
      ],
    },
  ]

  const groups = isAdmin ? adminGroups : userGroups
  const initial = profile?.name?.charAt(0) ?? '?'

  const handleLogout = async () => { await signOut(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <CardIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-sm leading-tight block">ReportePagos</span>
          <span className="text-gray-400 text-xs">{profile?.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
        </div>
      </div>

      {/* Nav con grupos */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-1">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-gray-700 pt-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-700">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.name}</p>
            <p className="text-gray-400 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-gray-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 bg-gray-800">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                <CardIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-800 text-sm">ReportePagos</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => isAdmin && navigate('/aprobaciones')}
              className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={isAdmin ? 'Ver aprobaciones pendientes' : ''}
            >
              <Bell className="w-5 h-5" />
              {isAdmin && <PendingBadge />}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                {initial}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{profile?.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
