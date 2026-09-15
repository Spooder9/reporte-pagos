import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUserRentals } from '../../hooks/useRentals'
import { useRentalPayments } from '../../hooks/useRentalPayments'
import { formatCurrency } from '../../lib/calculations'
import { Car, Bike, Package, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'

const VEHICLE_ICONS = { car: Car, motorcycle: Bike, other: Package }
const PERIOD_LABELS = { daily: 'diaria', weekly: 'semanal', monthly: 'mensual' }

export default function MyRentals() {
  const { profile } = useAuth()
  const { rentals, loading } = useUserRentals(profile?.id)
  const { payments } = useRentalPayments(undefined, profile?.id)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Vehículos</h1>
        <p className="text-gray-500 text-sm mt-1">{rentals.length} vehículos asignados</p>
      </div>

      {rentals.length === 0 ? (
        <div className="card text-center py-12">
          <Car className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tienes vehículos asignados</p>
          <p className="text-gray-400 text-sm mt-1">Contacta al administrador</p>
        </div>
      ) : rentals.map(rental => {
        const Icon = VEHICLE_ICONS[rental.vehicle_type]
        const vehiclePayments = payments.filter(p => p.rental_id === rental.id)
        const totalPaid = vehiclePayments.reduce((s, p) => s + p.amount, 0)
        const lastPayment = [...vehiclePayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

        return (
          <div key={rental.id} className="card space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{rental.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{rental.code}</span>
                      {rental.plate && <span className="text-xs text-gray-500">Placa: <strong>{rental.plate}</strong></span>}
                    </div>
                  </div>
                  <span className="badge-active flex-shrink-0">Activo</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Total pagado</p>
                <p className="text-sm font-bold text-red-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Pagos</p>
                <p className="text-sm font-bold text-gray-800">{vehiclePayments.length}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Tarifa ref.</p>
                <p className="text-sm font-bold text-gray-800">
                  {rental.reference_rate ? `${formatCurrency(rental.reference_rate)}` : '—'}
                </p>
                {rental.reference_rate && (
                  <p className="text-xs text-gray-400">{PERIOD_LABELS[rental.rate_period]}</p>
                )}
              </div>
            </div>

            {rental.description && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <span className="font-medium text-gray-700">Condiciones: </span>{rental.description}
              </div>
            )}

            {/* Últimos pagos */}
            {vehiclePayments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Últimos pagos</p>
                <div className="space-y-2">
                  {vehiclePayments.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">{p.date}</span>
                          {p.period_label && <span className="text-gray-400 text-xs">· {p.period_label}</span>}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{p.receipt_number}</span>
                        {p.comment && <p className="text-xs text-gray-400 mt-0.5">{p.comment}</p>}
                      </div>
                      <span className="font-bold text-green-700 text-sm">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to="/reportar-alquiler" className="btn-primary w-full text-center block py-2.5">
              Reportar pago de alquiler
            </Link>
          </div>
        )
      })}
    </div>
  )
}
