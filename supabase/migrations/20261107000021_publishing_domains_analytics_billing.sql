-- The four dashboard features that were "coming soon": publishing, custom domains,
-- visitor analytics and plans. Owners act only through these functions and the
-- existing row-level policies; nothing here widens what a visitor can read.

-- ---------------------------------------------------------------------------
-- Publishing. A publish freezes the saved draft into an immutable version, and
-- the live site renders only that version, so later edits stay private until
-- the next publish.
-- ---------------------------------------------------------------------------
create function public.log_owner_activity(p_action text, p_website_id uuid, p_metadata jsonb default '{}'::jsonb)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.activity_logs (actor_id, actor_email, action, target_type, target_id, metadata)
  select auth.uid(), p.email, p_action, 'website', p_website_id::text, p_metadata
  from public.profiles p
  where p.id = auth.uid();
$$;

create function public.publish_website(p_website_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_site public.websites;
  v_snapshot jsonb;
  v_number integer;
  v_version uuid;
begin
  if not public.is_active_user() or not public.owns_website(p_website_id) then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;

  -- Serializes publishes and version numbers for this website.
  select * into v_site from public.websites where id = p_website_id for update;

  if v_site.status = 'suspended' then
    raise exception 'This website is suspended and cannot be published. Contact support for help.' using errcode = 'WP001';
  end if;

  v_snapshot := public.get_website_draft(p_website_id);
  if v_snapshot ->> 'component_id' is null then
    raise exception 'This website has no theme to publish.' using errcode = 'WP002';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_snapshot -> 'pages') page
    where (page ->> 'isHome')::boolean and coalesce((page ->> 'isVisible')::boolean, true)
  ) then
    raise exception 'Add a visible homepage before publishing.' using errcode = 'WP003';
  end if;

  v_number := coalesce((select max(version_number) from public.website_versions where website_id = p_website_id), 0) + 1;

  insert into public.website_versions (website_id, version_number, snapshot, created_by, kind, label)
  values (p_website_id, v_number, v_snapshot, auth.uid(), 'published', 'Published')
  returning id into v_version;

  update public.websites
  set status = 'published', published_version_id = v_version, published_at = now()
  where id = p_website_id;

  perform public.log_owner_activity('website.publish', p_website_id, jsonb_build_object('version', v_number));

  return jsonb_build_object('version', v_number, 'slug', v_site.slug, 'published_at', now());
end;
$$;

create function public.unpublish_website(p_website_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() or not public.owns_website(p_website_id) then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;

  update public.websites set status = 'unpublished'
  where id = p_website_id and status = 'published';
  if not found then
    raise exception 'This website is not published.' using errcode = 'WP004';
  end if;

  perform public.log_owner_activity('website.unpublish', p_website_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Custom domains. Owners request a domain, add the DNS records shown in the
-- dashboard, and an admin verifies it. A verified domain serves the live site.
-- ---------------------------------------------------------------------------
alter table public.website_domains
  add constraint website_domains_hostname_format check (
    char_length(hostname) <= 253
    and hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
  ) not valid;

create function public.limit_website_domains()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.website_domains where website_id = new.website_id) >= 3 then
    raise exception 'A website can have up to 3 custom domains.' using errcode = 'WD001';
  end if;
  return new;
end;
$$;

create trigger website_domains_limit
  before insert on public.website_domains
  for each row execute function public.limit_website_domains();

-- Which live site a verified custom domain points to. Public, because the request
-- for a custom domain arrives before anyone is signed in.
create function public.get_site_slug_by_domain(p_hostname text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select w.slug
  from public.website_domains d
  join public.websites w on w.id = d.website_id
  join public.profiles p on p.id = w.owner_id
  where d.hostname = lower(p_hostname)
    and d.status = 'verified'
    and w.status = 'published'
    and p.account_status = 'active';
$$;

-- ---------------------------------------------------------------------------
-- Visitor analytics. Daily counts per page, never individual visitors, so no
-- personal data is stored.
-- ---------------------------------------------------------------------------
create table public.website_daily_views (
  website_id uuid not null references public.websites (id) on delete cascade,
  day date not null default current_date,
  page_slug text not null check (page_slug = '' or page_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  views integer not null default 0 check (views >= 0),
  primary key (website_id, day, page_slug)
);

alter table public.website_daily_views enable row level security;

create policy website_daily_views_select on public.website_daily_views
  for select to authenticated
  using (public.owns_website(website_id) or public.has_permission('analytics.view'));

grant select on public.website_daily_views to authenticated;

-- Counts one view of a live page. Only published sites count, and the page slug
-- is checked, so the table cannot be filled with arbitrary text.
create function public.record_site_view(p_site_slug text, p_page_slug text default '')
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.website_daily_views (website_id, day, page_slug, views)
  select w.id, current_date, coalesce(p_page_slug, ''), 1
  from public.websites w
  where w.slug = p_site_slug
    and w.status = 'published'
    and char_length(coalesce(p_page_slug, '')) <= 80
    and (coalesce(p_page_slug, '') = '' or p_page_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
  on conflict (website_id, day, page_slug) do update set views = public.website_daily_views.views + 1;
$$;

-- The signed-in user's traffic: daily totals, top pages and each website, for all
-- their websites or one of them.
create function public.get_my_analytics(p_days integer default 30, p_website_id uuid default null)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 7), 365);
  v_since date := current_date - (v_days - 1);
  v_sites uuid[];
begin
  if auth.uid() is null then
    raise exception 'Sign in to see analytics' using errcode = '42501';
  end if;
  if p_website_id is not null and not public.owns_website(p_website_id) then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(id), '{}') into v_sites
  from public.websites
  where owner_id = auth.uid() and (p_website_id is null or id = p_website_id);

  return jsonb_build_object(
    'days', v_days,
    'total', (select coalesce(sum(views), 0) from public.website_daily_views where website_id = any (v_sites) and day >= v_since),
    'previous_total', (
      select coalesce(sum(views), 0) from public.website_daily_views
      where website_id = any (v_sites) and day >= v_since - v_days and day < v_since
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'views', coalesce(v.views, 0)) order by d.day), '[]'::jsonb)
      from generate_series(v_since, current_date, interval '1 day') as d(day)
      left join (
        select day, sum(views) as views from public.website_daily_views
        where website_id = any (v_sites) and day >= v_since group by day
      ) v on v.day = d.day::date
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object('page_slug', page_slug, 'views', views) order by views desc), '[]'::jsonb)
      from (
        select page_slug, sum(views) as views from public.website_daily_views
        where website_id = any (v_sites) and day >= v_since
        group by page_slug order by views desc limit 10
      ) top
    ),
    'websites', (
      select coalesce(jsonb_agg(jsonb_build_object('id', w.id, 'name', w.name, 'slug', w.slug, 'status', w.status, 'views', coalesce(t.views, 0)) order by coalesce(t.views, 0) desc, w.name), '[]'::jsonb)
      from public.websites w
      left join (
        select website_id, sum(views) as views from public.website_daily_views
        where day >= v_since group by website_id
      ) t on t.website_id = w.id
      where w.id = any (v_sites)
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Plans. Online payment needs a payment provider, which is not set up yet, so a
-- user asks for a plan and an admin assigns it.
-- ---------------------------------------------------------------------------
create function public.current_plan_id(p_user_id uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (
      select s.plan_id from public.subscriptions s
      where s.user_id = p_user_id and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now())
      order by s.created_at desc limit 1
    ),
    (select id from public.plans where slug = 'free')
  );
$$;

create function public.get_my_billing()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_plan uuid;
begin
  if v_user is null then
    raise exception 'Sign in to see billing' using errcode = '42501';
  end if;
  v_plan := public.current_plan_id(v_user);

  return jsonb_build_object(
    'plan', (
      select jsonb_build_object('slug', p.slug, 'name', p.name, 'monthly_price_paise', p.monthly_price_paise,
        'website_limit', p.website_limit, 'storage_limit_mb', p.storage_limit_mb,
        'custom_domains', p.custom_domains, 'premium_themes', p.premium_themes, 'features', p.features)
      from public.plans p where p.id = v_plan
    ),
    'subscription', (
      select jsonb_build_object('status', s.status, 'current_period_start', s.current_period_start, 'current_period_end', s.current_period_end)
      from public.subscriptions s
      where s.user_id = v_user and s.status = 'active' and s.plan_id = v_plan
      order by s.created_at desc limit 1
    ),
    'usage', jsonb_build_object(
      'websites', (select count(*) from public.websites where owner_id = v_user),
      'published', (select count(*) from public.websites where owner_id = v_user and status = 'published'),
      'storage_bytes', (select coalesce(sum(size_bytes), 0) from public.media_assets where owner_id = v_user)
    ),
    'plans', (
      select coalesce(jsonb_agg(jsonb_build_object('slug', p.slug, 'name', p.name, 'monthly_price_paise', p.monthly_price_paise,
        'website_limit', p.website_limit, 'storage_limit_mb', p.storage_limit_mb, 'custom_domains', p.custom_domains,
        'premium_themes', p.premium_themes, 'features', p.features, 'is_active', p.is_active, 'is_current', p.id = v_plan
      ) order by p.display_order), '[]'::jsonb)
      from public.plans p
    ),
    'pending_request', (
      select t.subject from public.support_tickets t
      where t.user_id = v_user and t.status in ('open', 'in_progress') and t.subject like 'Plan request: %'
      order by t.created_at desc limit 1
    ),
    'payments', (
      select coalesce(jsonb_agg(jsonb_build_object('amount_paise', t.amount_paise, 'currency', t.currency,
        'status', t.status, 'created_at', t.created_at) order by t.created_at desc), '[]'::jsonb)
      from (select * from public.payment_transactions where user_id = v_user order by created_at desc limit 20) t
    )
  );
end;
$$;

-- Asks the team for a plan. One open request at a time.
create function public.request_plan(p_plan_slug text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
  v_ticket uuid;
begin
  if not public.is_active_user() then
    raise exception 'Sign in to request a plan' using errcode = '42501';
  end if;
  select * into v_plan from public.plans where slug = p_plan_slug;
  if not found then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;
  if v_plan.id = public.current_plan_id(auth.uid()) then
    raise exception 'You are already on this plan.' using errcode = 'WB001';
  end if;

  select id into v_ticket from public.support_tickets
  where user_id = auth.uid() and status in ('open', 'in_progress') and subject like 'Plan request: %';
  if found then
    update public.support_tickets
    set subject = 'Plan request: ' || v_plan.name,
      message = 'Please move my account to the ' || v_plan.name || ' plan.'
    where id = v_ticket;
    return v_ticket;
  end if;

  insert into public.support_tickets (user_id, subject, message)
  values (auth.uid(), 'Plan request: ' || v_plan.name, 'Please move my account to the ' || v_plan.name || ' plan.')
  returning id into v_ticket;
  return v_ticket;
end;
$$;

create function public.admin_set_user_plan(p_user_id uuid, p_plan_slug text, p_months integer default 1)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
begin
  perform public.require_permission('plans.manage');
  select * into v_plan from public.plans where slug = p_plan_slug;
  if not found then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  update public.subscriptions set status = 'canceled'
  where user_id = p_user_id and status = 'active';

  if v_plan.slug <> 'free' then
    insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    values (p_user_id, v_plan.id, 'active', now(), now() + make_interval(months => least(greatest(coalesce(p_months, 1), 1), 36)));
  end if;

  update public.support_tickets set status = 'resolved'
  where user_id = p_user_id and status in ('open', 'in_progress') and subject like 'Plan request: %';

  perform public.log_activity('user.plan_change', 'user', p_user_id::text, jsonb_build_object('plan', v_plan.slug, 'months', p_months));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function
  public.log_owner_activity(text, uuid, jsonb),
  public.publish_website(uuid),
  public.unpublish_website(uuid),
  public.limit_website_domains(),
  public.get_site_slug_by_domain(text),
  public.record_site_view(text, text),
  public.get_my_analytics(integer, uuid),
  public.current_plan_id(uuid),
  public.get_my_billing(),
  public.request_plan(text),
  public.admin_set_user_plan(uuid, text, integer)
from public, anon, authenticated;

grant execute on function
  public.publish_website(uuid),
  public.unpublish_website(uuid),
  public.get_my_analytics(integer, uuid),
  public.get_my_billing(),
  public.request_plan(text),
  public.admin_set_user_plan(uuid, text, integer)
to authenticated;

grant execute on function
  public.get_site_slug_by_domain(text),
  public.record_site_view(text, text)
to anon, authenticated;
