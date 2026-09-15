-- Permite al administrador actualizar el rol de cualquier perfil
create policy "Admin can update any profile" on public.profiles
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
