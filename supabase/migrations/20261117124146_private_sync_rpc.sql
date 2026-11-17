-- Keep privileged implementation outside exposed Data API schemas.
create schema if not exists practice_private;
revoke all on schema practice_private from public, anon;
grant usage on schema practice_private to authenticated;
alter function public.save_practice_state(uuid,bigint,jsonb) set schema practice_private;
revoke all on function practice_private.save_practice_state(uuid,bigint,jsonb) from public, anon;
grant execute on function practice_private.save_practice_state(uuid,bigint,jsonb) to authenticated;
create function public.save_practice_state(p_user uuid,p_revision bigint,p_payload jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$ select practice_private.save_practice_state(p_user,p_revision,p_payload); $$;
revoke all on function public.save_practice_state(uuid,bigint,jsonb) from public, anon;
grant execute on function public.save_practice_state(uuid,bigint,jsonb) to authenticated;
