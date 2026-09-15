import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import DebtCreate from './pages/admin/DebtCreate'
import AllDebts from './pages/admin/AllDebts'
import UserManagement from './pages/admin/UserManagement'
import Reports from './pages/admin/Reports'
import RentalManagement from './pages/admin/RentalManagement'
import RentalReports from './pages/admin/RentalReports'
import UserDashboard from './pages/user/Dashboard'
import MyDebts from './pages/user/MyDebts'
import ReportPayment from './pages/user/ReportPayment'
import MyRentals from './pages/user/MyRentals'
import ReportRentalPayment from './pages/user/ReportRentalPayment'
import Approvals from './pages/admin/Approvals'
import PaymentHistory from './pages/admin/PaymentHistory'
import PaymentStatus from './pages/user/PaymentStatus'
import EmpleadoDashboard from './pages/empleado/Dashboard'
import ManagedDebts from './pages/empleado/ManagedDebts'
import EmpleadoApprovals from './pages/empleado/EmpleadoApprovals'

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, profile } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          profile?.role === 'admin' ? <AdminDashboard /> :
          profile?.role === 'empleado' ? <EmpleadoDashboard /> :
          <UserDashboard />
        } />
        {/* Admin - Créditos */}
        <Route path="crear-deuda" element={<PrivateRoute adminOnly><DebtCreate /></PrivateRoute>} />
        <Route path="todas-las-deudas" element={<PrivateRoute adminOnly><AllDebts /></PrivateRoute>} />
        <Route path="reportes" element={<PrivateRoute adminOnly><Reports /></PrivateRoute>} />
        {/* Admin - Alquileres */}
        <Route path="alquileres" element={<PrivateRoute adminOnly><RentalManagement /></PrivateRoute>} />
        <Route path="reportes-alquileres" element={<PrivateRoute adminOnly><RentalReports /></PrivateRoute>} />
        {/* Admin - Aprobaciones e Historial */}
        <Route path="aprobaciones" element={<PrivateRoute adminOnly><Approvals /></PrivateRoute>} />
        <Route path="historial-pagos" element={<PrivateRoute adminOnly><PaymentHistory /></PrivateRoute>} />
        {/* Admin - Usuarios */}
        <Route path="usuarios" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
        {/* User - Créditos */}
        <Route path="mis-deudas" element={<PrivateRoute><MyDebts /></PrivateRoute>} />
        <Route path="reportar-pago" element={<PrivateRoute><ReportPayment /></PrivateRoute>} />
        {/* User - Alquileres */}
        <Route path="mis-vehiculos" element={<PrivateRoute><MyRentals /></PrivateRoute>} />
        <Route path="reportar-alquiler" element={<PrivateRoute><ReportRentalPayment /></PrivateRoute>} />
        {/* User - Estado de pagos */}
        <Route path="mis-pagos" element={<PrivateRoute><PaymentStatus /></PrivateRoute>} />
        {/* Empleado */}
        <Route path="gestion-deudas" element={<PrivateRoute><ManagedDebts /></PrivateRoute>} />
        <Route path="gestion-aprobaciones" element={<PrivateRoute><EmpleadoApprovals /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
