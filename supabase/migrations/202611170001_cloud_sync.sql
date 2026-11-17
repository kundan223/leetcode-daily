-- One private document per account. Clients can read only their own row.
create table if not exists public.practice_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint practice_payload_size check (octet_length(payload::text) <= 10000000)
);
alter table public.practice_state enable row level security;
revoke all on public.practice_state from anon, authenticated;
grant select on public.practice_state to authenticated;
drop policy if exists practice_read_own on public.practice_state;
create policy practice_read_own on public.practice_state for select to authenticated
  using ((select auth.uid()) = user_id);

-- Serialize writes, require the expected revision, and derive ownership from Auth.
-- p_user is an additional guard against a browser switching accounts mid-request.
create or replace function public.save_practice_state(p_user uuid, p_revision bigint, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  saved public.practice_state%rowtype;
begin
  if current_user_id is null or p_user is distinct from current_user_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_revision is null or p_revision < 0 or p_payload is null
    or p_payload->>'app' is distinct from 'daily-practice'
    or p_payload->>'version' is distinct from '3'
    or jsonb_typeof(p_payload->'sheets') is distinct from 'object'
    or jsonb_typeof(p_payload->'courses') is distinct from 'object'
    or jsonb_typeof(p_payload->'activity') is distinct from 'object'
    or octet_length(p_payload::text) > 10000000 then
    raise exception 'Invalid practice document' using errcode = '22023';
  end if;
  -- Transaction-scoped lock also protects the first insert (where no row exists).
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  select * into saved from public.practice_state where user_id = current_user_id for update;
  if found then
    if saved.revision <> p_revision then
      return jsonb_build_object('conflict', true, 'revision', saved.revision, 'payload', saved.payload);
    end if;
    update public.practice_state set payload=p_payload, revision=revision+1, updated_at=now()
      where user_id=current_user_id returning * into saved;
  else
    if p_revision <> 0 then
      return jsonb_build_object('conflict', true, 'revision', 0, 'payload', null);
    end if;
    insert into public.practice_state(user_id,payload) values(current_user_id,p_payload) returning * into saved;
  end if;
  return jsonb_build_object('conflict', false, 'revision', saved.revision, 'payload', saved.payload);
end;
$$;
revoke all on function public.save_practice_state(uuid,bigint,jsonb) from public, anon;
grant execute on function public.save_practice_state(uuid,bigint,jsonb) to authenticated;
