-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- Tabla de perfiles (extiende auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- Tabla de deudas
create table public.debts (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  description text not null,
  product text,
  amount numeric(12,2) not null,
  interest_rate numeric(5,2) not null default 0,
  months integer not null,
  monthly_payment numeric(12,2) not null,
  total_interest numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'overdue')),
  interest_description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Tabla de miembros de deuda (relación many-to-many)
create table public.debt_members (
  id uuid default uuid_generate_v4() primary key,
  debt_id uuid references public.debts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  share numeric(5,2) not null check (share > 0 and share <= 100),
  unique(debt_id, user_id)
);

-- Tabla de pagos
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  debt_id uuid references public.debts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  amount numeric(12,2) not null,
  date date not null,
  receipt_number text not null,
  comment text,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.debts enable row level security;
alter table public.debt_members enable row level security;
alter table public.payments enable row level security;

-- Políticas para profiles
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admin can insert profiles" on public.profiles
  for insert with check (true);

-- Políticas para debts
create policy "All users can view debts" on public.debts
  for select using (true);

create policy "Admin can manage debts" on public.debts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Políticas para debt_members
create policy "All users can view debt members" on public.debt_members
  for select using (true);

create policy "Admin can manage debt members" on public.debt_members
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Políticas para payments
create policy "Users can view own payments" on public.payments
  for select using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert own payments" on public.payments
  for insert with check (user_id = auth.uid());

create policy "Admin can manage payments" on public.payments
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Función para crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
