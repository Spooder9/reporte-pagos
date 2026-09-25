-- Función para confirmar el email de un usuario recién creado por un admin.
-- Necesaria porque signUp() desde el cliente no auto-confirma cuando la sesión admin está activa.
create or replace function public.admin_confirm_user(user_id uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Solo administradores pueden confirmar usuarios';
  end if;

  update auth.users
  set email_confirmed_at = now(),
      updated_at = now()
  where id = user_id;
end;
$$ language plpgsql security definer;
