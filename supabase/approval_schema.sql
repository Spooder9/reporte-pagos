-- Agregar columnas de aprobación a payments
alter table public.payments
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- Agregar columnas de aprobación a rental_payments
alter table public.rental_payments
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- Índices para rendimiento
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_rental_payments_status on public.rental_payments(status);
