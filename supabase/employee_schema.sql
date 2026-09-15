-- Agregar 'empleado' al check de roles en profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'empleado', 'user'));

-- Agregar campo managed_by a debts (empleado asignado a gestionar la deuda)
alter table public.debts add column if not exists managed_by uuid references public.profiles(id);

-- Política: empleado solo ve deudas asignadas a él
drop policy if exists "All users can view debts" on public.debts;

create policy "Admin ve todas las deudas" on public.debts
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Empleado ve sus deudas asignadas" on public.debts
  for select using (
    managed_by = auth.uid()
  );

create policy "Usuario ve sus deudas" on public.debts
  for select using (
    exists (
      select 1 from public.debt_members
      where debt_id = debts.id and user_id = auth.uid()
    )
  );

-- Política: empleado puede aprobar pagos de sus deudas
drop policy if exists "Admin can manage payments" on public.payments;

create policy "Admin gestiona todos los pagos" on public.payments
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Empleado aprueba pagos de sus deudas" on public.payments
  for update using (
    exists (
      select 1 from public.debts
      where debts.id = payments.debt_id and debts.managed_by = auth.uid()
    )
  );
