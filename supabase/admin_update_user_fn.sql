-- Función para que el admin pueda cambiar nombre y contraseña de cualquier usuario
create or replace function public.admin_update_user(
  target_user_id uuid,
  new_name text default null,
  new_password text default null
)
returns void as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Solo administradores pueden modificar usuarios';
  end if;

  if new_name is not null and trim(new_name) != '' then
    update public.profiles
    set name = trim(new_name)
    where id = target_user_id;

    update auth.users
    set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('name', trim(new_name)),
        updated_at = now()
    where id = target_user_id;
  end if;

  if new_password is not null and length(trim(new_password)) >= 6 then
    update auth.users
    set encrypted_password = crypt(new_password, gen_salt('bf', 10)),
        updated_at = now()
    where id = target_user_id;
  end if;
end;
$$ language plpgsql security definer;
