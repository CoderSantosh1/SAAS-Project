-- Reference data the platform needs in every environment, then API privileges.

insert into public.admin_permissions (key, description) values
  ('users.view', 'View users and their details'),
  ('users.manage', 'Suspend and restore user accounts'),
  ('categories.manage', 'Create and edit categories'),
  ('themes.manage', 'Upload, review and publish themes'),
  ('templates.manage', 'Create and publish template listings'),
  ('websites.view', 'View user websites, including drafts'),
  ('websites.moderate', 'Suspend and moderate user websites'),
  ('media.manage', 'Manage platform-owned media'),
  ('media.view_user', 'View records of user-owned media'),
  ('domains.manage', 'Review and manage domains'),
  ('analytics.view', 'View platform analytics'),
  ('plans.manage', 'Manage plans and view billing records'),
  ('support.manage', 'Handle support tickets'),
  ('activity_logs.view', 'View the admin activity log'),
  ('settings.manage', 'Change platform settings');

insert into public.admin_roles (slug, name, description, is_super) values
  ('super_admin', 'Super Admin', 'Complete platform permissions', true),
  ('platform_admin', 'Platform Admin', 'Runs day-to-day platform operations', false),
  ('content_manager', 'Content Manager', 'Manages marketplace content', false),
  ('support_admin', 'Support Admin', 'Helps users and handles tickets', false);

insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
from public.admin_roles r
join public.admin_permissions p on (
  (r.slug = 'platform_admin' and p.key in (
    'users.view', 'users.manage', 'categories.manage', 'themes.manage', 'templates.manage',
    'websites.view', 'websites.moderate', 'media.manage', 'domains.manage',
    'analytics.view', 'support.manage', 'activity_logs.view'
  ))
  or (r.slug = 'content_manager' and p.key in (
    'categories.manage', 'themes.manage', 'templates.manage', 'media.manage'
  ))
  or (r.slug = 'support_admin' and p.key in (
    'users.view', 'websites.view', 'support.manage'
  ))
);

insert into public.categories (name, slug, status, display_order)
select name, slug, 'published', ordinality * 10
from unnest(array[
  'Business', 'Corporate', 'Digital Agency', 'IT Company', 'Portfolio', 'Developer Portfolio',
  'Photography', 'Architecture', 'Hospital', 'Medical Clinic', 'IVF Center', 'Dental Clinic',
  'Pharmacy', 'School', 'College', 'Coaching Institute', 'Online Education', 'Restaurant',
  'Cafe', 'Bakery', 'Hotel', 'Travel Agency', 'Tourism', 'E-commerce', 'Fashion', 'Electronics',
  'Furniture', 'Grocery', 'Law Firm', 'Real Estate', 'Interior Design', 'Construction',
  'Financial Services', 'Insurance', 'Wedding Planner', 'Event Management', 'NGO', 'Fitness',
  'Gym', 'Yoga', 'Automobile', 'Car Rental', 'News', 'Magazine', 'Blog', 'Entertainment',
  'Salon', 'Spa', 'Personal Branding', 'Consulting'
]) with ordinality as c(name, ordinality)
cross join lateral (
  select trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) as slug
) s;

-- Paid plans stay inactive until pricing is validated. Prices are the PRD's
-- provisional hypotheses.
insert into public.plans (slug, name, monthly_price_paise, is_active, display_order) values
  ('free', 'Free', 0, true, 10),
  ('starter', 'Starter', 9900, false, 20),
  ('professional', 'Professional', 19900, false, 30),
  ('business', 'Business', 39900, false, 40),
  ('agency', 'Agency', 79900, false, 50);

insert into public.platform_settings (key, value, is_public) values
  ('platform.name', '"WEB"', true),
  ('platform.maintenance_mode', 'false', true);

-- ---------------------------------------------------------------------------
-- Privileges. Tables are reachable only through RLS; anon gets only what the
-- public policies need. Supabase grants broadly by default, so reset first.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all functions in schema public to service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
-- The audit log and billing rows have no client write path at all.
revoke insert, update, delete on public.activity_logs from authenticated;
revoke insert, update, delete on public.subscriptions from authenticated;
revoke insert, update, delete on public.usage_records from authenticated;
revoke insert, update, delete on public.payment_transactions from authenticated;
-- Profiles are created by the auth trigger and removed with the auth user.
revoke insert, delete on public.profiles from authenticated;

grant select on
  public.categories, public.themes, public.theme_versions, public.theme_sections,
  public.templates, public.template_categories, public.plans, public.platform_settings
to anon;

-- Helpers called from policies that apply to signed-in users.
grant execute on function
  public.is_active_user(), public.is_admin(), public.is_super_admin(),
  public.has_permission(text), public.my_admin_access(),
  public.owns_website(uuid), public.owns_page(uuid),
  public.log_activity(text, text, text, jsonb)
to authenticated;

-- Helpers called from policies that also apply to visitors, plus trigger-side
-- validation and the public site reader.
grant execute on function
  public.is_theme_published(uuid), public.is_theme_version_published(uuid),
  public.is_template_public(uuid), public.is_valid_subdomain(text),
  public.get_published_site(text)
to anon, authenticated;

-- Trigger functions run as the writing role, so it needs execute on these.
grant execute on function
  public.set_updated_at(), public.guard_profile_update(), public.guard_website_update(),
  public.guard_home_page_delete(), public.guard_last_super_admin(),
  public.prevent_activity_log_change()
to authenticated;

-- Keep future functions private unless a migration grants them explicitly.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
