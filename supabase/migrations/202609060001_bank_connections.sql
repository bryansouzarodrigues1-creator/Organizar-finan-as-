-- Apply only in the chosen Lovable/Supabase project. No credentials in SQL.
create table public.bank_connections (
 item_id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 institution text not null,
 sandbox boolean not null,
 notice_version text not null default 'bank-read-v1',
 accepted_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table public.bank_snapshots (
 item_id uuid not null references public.bank_connections(item_id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 month text not null check (month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
 payload jsonb not null,
 synced_at timestamptz not null default now(),
 primary key(item_id,month)
);
alter table public.bank_connections enable row level security;
alter table public.bank_snapshots enable row level security;
create policy owner_read_connection on public.bank_connections for select to authenticated using ((select auth.uid())=user_id);
create policy owner_read_snapshot on public.bank_snapshots for select to authenticated using ((select auth.uid())=user_id);
-- Writes must pass the verified server flow. A client cannot assign another user's item.
revoke all on public.bank_connections, public.bank_snapshots from anon,authenticated;
grant select on public.bank_connections, public.bank_snapshots to authenticated;
grant all on public.bank_connections, public.bank_snapshots to service_role;
create table public.bank_request_limits (user_id uuid primary key references auth.users(id) on delete cascade,window_started timestamptz not null default now(),requests integer not null default 0);
alter table public.bank_request_limits enable row level security;
revoke all on public.bank_request_limits from anon,authenticated;
create function public.take_bank_request(p_user uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare current_row public.bank_request_limits;
begin
 insert into public.bank_request_limits(user_id) values(p_user) on conflict do nothing;
 select * into current_row from public.bank_request_limits where user_id=p_user for update;
 if current_row.window_started < now()-interval '1 minute' then
  update public.bank_request_limits set window_started=now(),requests=1 where user_id=p_user; return true;
 end if;
 if current_row.requests>=6 then return false; end if;
 update public.bank_request_limits set requests=requests+1 where user_id=p_user; return true;
end $$;
revoke all on function public.take_bank_request(uuid) from public,anon,authenticated;
grant execute on function public.take_bank_request(uuid) to service_role;
