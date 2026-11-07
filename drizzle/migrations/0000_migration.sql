create table public.ai_rate_limits (
  user_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (user_key, window_start)
);
alter table public.ai_rate_limits enable row level security;
-- No policies: only the backend (service role) reads/writes. user_key is a one-way hash.
revoke all on public.ai_rate_limits from anon, authenticated;
grant all on public.ai_rate_limits to service_role;

create or replace function public.ai_rate_limit_hit(_user_key text, _window_seconds integer, _max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _start timestamptz := to_timestamp(floor(extract(epoch from now()) / _window_seconds) * _window_seconds);
  _count integer;
begin
  insert into public.ai_rate_limits(user_key, window_start, count)
  values (_user_key, _start, 1)
  on conflict (user_key, window_start) do update set count = public.ai_rate_limits.count + 1
  returning count into _count;
  delete from public.ai_rate_limits where window_start < now() - interval '1 day';
  return _count <= _max;
end;
$$;
revoke execute on function public.ai_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_rate_limit_hit(text, integer, integer) to service_role;