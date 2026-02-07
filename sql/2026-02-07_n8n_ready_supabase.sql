-- =========================================================
-- n8n-ready Supabase setup (safe / idempotent)
-- =========================================================

-- 1) Ensure columns on clients (canonical coach record)
alter table public.clients
  add column if not exists chatbot_id text;

alter table public.clients
  add column if not exists chatbot_url text;

-- Optional future-proofing: if you later move refresh token into clients
alter table public.clients
  add column if not exists google_refresh_token text;

-- 2) Index for fast lookup by chatbot_id
create index if not exists clients_chatbot_id_idx
  on public.clients (chatbot_id);

-- Optional uniqueness (enable only if you guarantee uniqueness)
-- create unique index if not exists clients_chatbot_id_unique
--   on public.clients (chatbot_id)
--   where chatbot_id is not null and chatbot_id <> '';

-- 3) View n8n can query for “all integrations in one place”
--    If legacy coach_google exists, use it as token source.
--    If it doesn't exist, the view still works using clients.google_refresh_token.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'coach_google'
  ) then
    execute $v$
      create or replace view public.coach_integrations as
      select
        c.id as coach_id,
        c.chatbot_id,
        c.chatbot_url,
        c.stripe_account_id,
        c.stripe_onboarding_complete,
        c.stripe_connected_at,
        c.google_calendar_id,
        c.google_connected_at,
        coalesce(g.google_refresh_token, c.google_refresh_token) as google_refresh_token
      from public.clients c
      left join public.coach_google g
        on g.user_id = c.id
    $v$;
  else
    execute $v$
      create or replace view public.coach_integrations as
      select
        c.id as coach_id,
        c.chatbot_id,
        c.chatbot_url,
        c.stripe_account_id,
        c.stripe_onboarding_complete,
        c.stripe_connected_at,
        c.google_calendar_id,
        c.google_connected_at,
        c.google_refresh_token
      from public.clients c
    $v$;
  end if;
end $$;

-- 4) Ensure every auth user has a clients row (prevents UI/.single() failures)
-- NOTE: This is the standard Supabase pattern. Safe to run multiple times.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clients (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;
