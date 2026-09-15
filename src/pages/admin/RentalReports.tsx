import React, { useState } from 'react'
import { useRentals } from '../../hooks/useRentals'
import { useAllRentalPayments } from '../../hooks/useRentalPayments'
import { formatCurrency } from '../../lib/calculations'
import { TrendingUp, Car, Bike, Package, Search, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

const VEHICLE_ICONS = { car: Car, motorcycle: Bike, other: Package }

export default function RentalReports() {
  const { rentals, loading: lr } = useRentals()
  const { payments, loading: lp } = useAllRentalPayments()
  const [search, setSearch] = useState('')
  const [selectedRental, setSelectedRental] = useState<string>('all')

  if (lr || lp) return <LoadingSpinner />

  const totalProduced = payments.reduce((s, p) => s + p.amount, 0)
  const activeRentals = rentals.filter(r => r.status === 'active').length

  const filteredPayments = payments.filter(p => {
    const matchRental = selectedRental === 'all' || p.rental_id === selectedRental
    const rental = rentals.find(r => r.id === p.rental_id)
    const matchSearch = !search ||
      rental?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.receipt_number.toLowerCase().includes(search.toLowerCase())
    return matchRental && matchSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes de Alquileres</h1>
        <p className="text-gray-500 text-sm mt-1">Control de ingresos por vehículo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalProduced)}</p>
            <p className="text-gray-500 text-sm">Total producido</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Car className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{activeRentals}</p>
            <p className="text-gray-500 text-sm">Vehículos activos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{payments.length}</p>
            <p className="text-gray-500 text-sm">Pagos registrados</p>
          </div>
        </div>
      </div>

      {/* Por vehículo */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Producción por Vehículo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rentals.map(rental => {
            const Icon = VEHICLE_ICONS[rental.vehicle_type]
            const total = payments.filter(p => p.rental_id === rental.id).reduce((s, p) => s + p.amount, 0)
            const count = payments.filter(p => p.rental_id === rental.id).length
            return (
              <button
                key={rental.id}
                onClick={() => setSelectedRental(selectedRental === rental.id ? 'all' : rental.id)}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  selectedRental === rental.id ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 truncate">{rental.name}</span>
                </div>
                {rental.plate && <p className="text-xs text-gray-400 mb-2">Placa: {rental.plate}</p>}
                <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                <p className="text-xs text-gray-400">{count} pagos · {rental.assigned_profile?.name}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-800 flex-1">Historial de Pagos</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-9 py-1.5 text-sm" />
            </div>
            {selectedRental !== 'all' && (
              <button onClick={() => setSelectedRental('all')} className="btn-ghost text-sm py-1.5 px-3">Ver todos</button>
            )}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No hay pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha', 'Conductor', 'Vehículo', 'Período', 'Comprobante', 'Monto'].map(h => (
                    <th key={h} className={`py-2 px-3 text-gray-500 font-medium ${h === 'Monto' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => {
                  const rental = rentals.find(r => r.id === p.rental_id)
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">{p.date}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{p.profile?.name}</td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-[150px] truncate">{rental?.name}</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{p.period_label ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-400 text-xs">{p.receipt_number}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-green-700">{formatCurrency(p.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={5} className="py-2.5 px-3 text-sm font-semibold text-gray-700">Total filtrado</td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
