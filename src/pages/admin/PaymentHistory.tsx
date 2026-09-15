import React, { useState, useEffect, useCallback } from 'react'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/calculations'
import { Search, Filter, CheckCircle, XCircle, Clock, CreditCard, Car } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface HistoryRow {
  id: string
  type: 'credit' | 'rental'
  user_name: string
  user_email: string
  reference: string
  reference_code: string
  amount: number
  date: string
  receipt_number: string
  comment: string | null
  period_label?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
      <CheckCircle className="w-3 h-3" /> Aprobado
    </span>
  )
  if (status === 'rejected') return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
      <XCircle className="w-3 h-3" /> Rechazado
    </span>
  )
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
      <Clock className="w-3 h-3" /> Pendiente
    </span>
  )
}

export default function PaymentHistory() {
  const { profiles } = useProfiles()
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: cp }, { data: rp }] = await Promise.all([
      supabase.from('payments').select('*, profile:profiles(*), debt:debts(description, code)').order('created_at', { ascending: false }),
      supabase.from('rental_payments').select('*, profile:profiles(*), rental:rentals(name, code)').order('created_at', { ascending: false }),
    ])

    const creditRows: HistoryRow[] = (cp ?? []).map((p: any) => ({
      id: p.id, type: 'credit',
      user_name: p.profile?.name ?? '—', user_email: p.profile?.email ?? '',
      reference: p.debt?.description ?? '—', reference_code: p.debt?.code ?? '—',
      amount: p.amount, date: p.date, receipt_number: p.receipt_number,
      comment: p.comment, status: p.status,
      rejection_reason: p.rejection_reason, created_at: p.created_at,
    }))

    const rentalRows: HistoryRow[] = (rp ?? []).map((p: any) => ({
      id: p.id, type: 'rental',
      user_name: p.profile?.name ?? '—', user_email: p.profile?.email ?? '',
      reference: p.rental?.name ?? '—', reference_code: p.rental?.code ?? '—',
      amount: p.amount, date: p.date, receipt_number: p.receipt_number,
      comment: p.comment, period_label: p.period_label, status: p.status,
      rejection_reason: p.rejection_reason, created_at: p.created_at,
    }))

    const all = [...creditRows, ...rentalRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setRows(all)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = rows.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (userFilter !== 'all' && r.user_email !== userFilter) return false
    if (dateFrom && r.date < dateFrom) return false
    if (dateTo && r.date > dateTo) return false
    if (search) {
      const q = search.toLowerCase()
      return r.user_name.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.receipt_number.toLowerCase().includes(q) ||
        r.reference_code.toLowerCase().includes(q)
    }
    return true
  })

  const totalApproved = filtered.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0)
  const totalPending = filtered.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const users = profiles.filter(p => p.role === 'user')

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de Pagos</h1>
        <p className="text-gray-500 text-sm mt-1">{rows.length} registros en total</p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalApproved)}</p>
            <p className="text-gray-500 text-xs">Aprobado (filtrado)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPending)}</p>
            <p className="text-gray-500 text-xs">Pendiente (filtrado)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Filter className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
            <p className="text-gray-500 text-xs">Registros filtrados</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-9 py-2 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 text-sm">
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field py-2 text-sm">
            <option value="all">Todos los tipos</option>
            <option value="credit">Créditos</option>
            <option value="rental">Alquileres</option>
          </select>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="input-field py-2 text-sm">
            <option value="all">Todos los usuarios</option>
            {users.map(u => <option key={u.id} value={u.email}>{u.name}</option>)}
          </select>
          <div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field py-2 text-sm" placeholder="Desde" />
          </div>
          <div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field py-2 text-sm" placeholder="Hasta" />
          </div>
        </div>
        {(search || statusFilter !== 'all' || typeFilter !== 'all' || userFilter !== 'all' || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setUserFilter('all'); setDateFrom(''); setDateTo('') }}
            className="text-xs text-red-600 hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Usuario', 'Tipo', 'Referencia', 'Comprobante', 'Monto', 'Estado', 'Detalles'].map(h => (
                  <th key={h} className={`py-3 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wide ${h === 'Monto' ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">No se encontraron registros</td>
                </tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{r.date}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{r.user_name}</p>
                    <p className="text-xs text-gray-400">{r.user_email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'credit' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                      {r.type === 'credit' ? <CreditCard className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                      {r.type === 'credit' ? 'Crédito' : 'Alquiler'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-700 max-w-[180px] truncate">{r.reference}</p>
                    <p className="text-xs font-mono text-gray-400">{r.reference_code}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500 text-xs">{r.receipt_number}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">{formatCurrency(r.amount)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 px-4">
                    {r.comment && (
                      <p className="text-xs text-gray-500 max-w-[120px] truncate" title={r.comment}>
                        {r.comment}
                      </p>
                    )}
                    {r.rejection_reason && (
                      <p className="text-xs text-red-500 max-w-[120px] truncate" title={r.rejection_reason}>
                        Rechazado: {r.rejection_reason}
                      </p>
                    )}
                    {r.period_label && (
                      <p className="text-xs text-gray-400">{r.period_label}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-sm font-semibold text-gray-700">
                    Total ({filtered.length} registros)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {formatCurrency(filtered.reduce((s, r) => s + r.amount, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
