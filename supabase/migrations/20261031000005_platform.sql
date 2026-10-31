-- Monetization (inactive at launch), platform settings, audit log and support.

create type public.subscription_status as enum ('active', 'past_due', 'canceled');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  monthly_price_paise integer not null default 0 check (monthly_price_paise >= 0),
  website_limit integer,
  storage_limit_mb integer,
  custom_domains boolean not null default false,
  premium_themes boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_plan_idx on public.subscriptions (plan_id);

create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  metric text not null,
  quantity bigint not null,
  recorded_at timestamptz not null default now()
);

create index usage_records_user_idx on public.usage_records (user_id, metric, recorded_at desc);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  provider text,
  provider_reference text,
  created_at timestamptz not null default now()
);

create index payment_transactions_user_idx on public.payment_transactions (user_id, created_at desc);
create index payment_transactions_subscription_idx on public.payment_transactions (subscription_id);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  -- Only public settings are readable without the settings permission.
  is_public boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index platform_settings_updated_by_idx on public.platform_settings (updated_by);

-- actor_id has no foreign key so the record outlives the account it describes.
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);
create index activity_logs_action_idx on public.activity_logs (action, created_at desc);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  website_id uuid references public.websites (id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 200),
  message text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index support_tickets_status_idx on public.support_tickets (status, created_at desc);
create index support_tickets_website_idx on public.support_tickets (website_id);
create index support_tickets_assigned_idx on public.support_tickets (assigned_to);

create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger platform_settings_set_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();
create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create function public.prevent_activity_log_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Activity logs are append-only' using errcode = '42501';
end;
$$;

create trigger activity_logs_append_only
  before update or delete on public.activity_logs
  for each row execute function public.prevent_activity_log_change();

-- The only write path for the audit log. The actor comes from the session, so a
-- caller cannot record an action under someone else's name.
create function public.log_activity(
  action text,
  target_type text default null,
  target_id text default null,
  metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can write activity logs' using errcode = '42501';
  end if;

  insert into public.activity_logs (actor_id, actor_email, action, target_type, target_id, metadata)
  select auth.uid(), p.email, log_activity.action, log_activity.target_type,
    log_activity.target_id, log_activity.metadata
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.platform_settings enable row level security;
alter table public.activity_logs enable row level security;
alter table public.support_tickets enable row level security;

create policy plans_public_select on public.plans
  for select to anon, authenticated using (is_active);
create policy plans_admin on public.plans
  for all to authenticated
  using (public.has_permission('plans.manage'))
  with check (public.has_permission('plans.manage'));

-- Billing rows are written by trusted server code only.
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('plans.manage'));
create policy usage_records_select on public.usage_records
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('plans.manage'));
create policy payment_transactions_select on public.payment_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('plans.manage'));

create policy platform_settings_public_select on public.platform_settings
  for select to anon, authenticated using (is_public);
create policy platform_settings_admin on public.platform_settings
  for all to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

create policy activity_logs_select on public.activity_logs
  for select to authenticated using (public.has_permission('activity_logs.view'));

create policy support_tickets_select on public.support_tickets
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('support.manage'));
create policy support_tickets_insert on public.support_tickets
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_active_user()
    and status = 'open'
    and priority = 'normal'
    and assigned_to is null
    and (website_id is null or public.owns_website(website_id))
  );
create policy support_tickets_admin_update on public.support_tickets
  for update to authenticated
  using (public.has_permission('support.manage'))
  with check (public.has_permission('support.manage'));
