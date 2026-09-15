-- Tabla de vehículos/activos en alquiler
create table public.rentals (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  name text not null,
  vehicle_type text not null default 'car' check (vehicle_type in ('car', 'motorcycle', 'other')),
  plate text,
  description text,
  reference_rate numeric(12,2),
  rate_period text default 'weekly' check (rate_period in ('daily', 'weekly', 'monthly')),
  assigned_to uuid references public.profiles(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Tabla de pagos de alquiler
create table public.rental_payments (
  id uuid default uuid_generate_v4() primary key,
  rental_id uuid references public.rentals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  amount numeric(12,2) not null,
  date date not null,
  period_label text,
  receipt_number text not null,
  comment text,
  created_at timestamptz default now()
);

-- RLS
alter table public.rentals enable row level security;
alter table public.rental_payments enable row level security;

-- Políticas para rentals
create policy "All users can view rentals" on public.rentals
  for select using (true);

create policy "Admin can manage rentals" on public.rentals
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Políticas para rental_payments
create policy "Users can view own rental payments" on public.rental_payments
  for select using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert own rental payments" on public.rental_payments
  for insert with check (user_id = auth.uid());

create policy "Admin can manage rental payments" on public.rental_payments
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
