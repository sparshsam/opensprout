-- OpenSprout v0.9.2 — Account deletion RPC function
-- Safely deletes all user data in the public schema.
-- Auth account deletion is handled server-side via Supabase Admin API.

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Get the calling user's ID
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete in dependency order to respect foreign keys
  delete from public.journal_photos where user_id = v_user_id;
  delete from public.journal_entries where user_id = v_user_id;
  delete from public.care_logs where user_id = v_user_id;
  delete from public.task_instances where user_id = v_user_id;
  delete from public.care_schedules where user_id = v_user_id;
  delete from public.identifications where user_id = v_user_id;
  delete from public.mcp_tokens where user_id = v_user_id;
  delete from public.sync_devices where user_id = v_user_id;
  delete from public.data_transfers where user_id = v_user_id;
  delete from public.plants where user_id = v_user_id;
  delete from public.profiles where id = v_user_id;

  -- Note: Auth account deletion is handled separately server-side
  -- via the Supabase Admin API (auth.admin.deleteUser).
  -- The frontend calls this function for data, then signs out.
  -- A scheduled job or admin endpoint handles the auth cleanup.
end;
$$;

-- Revoke execute from public — only authenticated users can call it
revoke execute on function public.delete_account() from anon, public;
grant execute on function public.delete_account() to authenticated;

comment on function public.delete_account() is 'OpenSprout: deletes all user-owned data';
