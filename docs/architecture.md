# Architecture

One Next.js app and one Supabase project serve the public site, the user panel and the admin panel. The panels are separate in routes, layouts, navigation and authorization, and share only low-level UI, services and types.

| Area | Location |
|---|---|
| User panel | `src/app/dashboard`, `src/components/user` |
| Admin panel | `src/app/admin/(panel)`, `src/components/admin` |
| Admin login and access denied | `src/app/admin/login`, `src/app/admin/forbidden`, outside the guarded panel layout |
| Data access and actions | `src/features/*` |
| Database schema | `supabase/migrations` |

## Authorization layers

1. **Proxy** (`src/proxy.ts`) refreshes the session and redirects signed-out visitors early. It does not check roles.
2. **Server checks** (`requireUser`, `requireAdmin` in `src/lib/auth/session.ts`) must be called by every protected page and server action, not only by layouts.
3. **RLS** in Postgres is the final authority. It holds even if the first two layers have a bug.

## Admin access

Admin rights exist only in `admin_user_roles`, which only a Super Admin can write. A role marked `is_super` holds every permission, including future ones. Other roles hold only the permissions listed in `admin_role_permissions`. Suspending an admin's account removes their rights at once.

The first Super Admin is created with `grant_super_admin()`, which API roles cannot execute. The last Super Admin cannot be removed.

RLS works on rows, so column rules are enforced by triggers: `guard_profile_update` protects account status and `guard_website_update` protects ownership and publishing state.

## Draft and published content

`website_pages` and `website_sections` hold the private draft. Publishing will write an immutable snapshot to `website_versions` and point `websites.published_version_id` at it. Visitors have no access to website tables and read only through `get_published_site()`, so draft edits cannot reach a live site.

## Themes

An uploaded theme package supplies only data and assets, and its code is never executed. Every theme version maps through `component_id` to a React component approved in the code-level registry, so new layouts or section types require a code deploy.

A theme lives in `src/themes/implementations/<id>/`: `definition.ts` holds plain data (tokens, starter pages) and `components.ts` picks its layouts from `src/themes/shared/sections.tsx`. `src/themes/registry.ts` is the list of themes allowed to render.

A theme can also offer section types of its own through `customSections`, each with a Zod schema, editor fields, defaults and a component (see [theme-development.md](theme-development.md)). `getSectionDefinition` in `src/themes/sections.ts` is the single place that resolves a section type for a theme. The renderer, editor, package validator and seed generator all go through it, so a custom section is validated exactly like a built-in one.

`SiteRenderer` treats stored content as untrusted. It renders only registered theme versions and known section types, validates each section against its Zod schema, and skips what fails, so one bad section cannot break a page. The schemas also reject unsafe links, image URLs, colors and fonts.

Theme rows in the database are generated from the registry with `pnpm themes:seed <migration_name>`, and a test fails if the two drift apart. Published sites will record their exact theme version, so keep old versions in the registry when adding new ones.

`/preview/themes/<slug>` shows a theme with its own starter content.

Admins can also upload themes as data-only packages, described in [theme-packages.md](theme-packages.md). Such a theme stores its own tokens and starter content in `theme_versions`, and `component_id` with `component_version` name the registered component that renders it. So rendering always reads a version's stored tokens rather than the component's defaults.

Theme admin actions run through definer functions that check `themes.manage` and write the audit record in the same transaction, so an action cannot happen unlogged.

## Public marketplace

Public pages read through `list_marketplace_templates`, `list_public_categories` and `get_marketplace_theme`. These are security invoker functions, so RLS still applies, and they filter on published state explicitly so that admins see the same listing as visitors.

A theme card shows its uploaded thumbnail when it has one, and otherwise a scaled, live preview in an iframe. The iframe's sandbox has no `allow-scripts`, so a framed site is static HTML.

Only `/preview/*` can be framed, and only by this site. Every other route sends `X-Frame-Options: DENY`.

The homepage hides its marketplace sections during a database failure. Other data-driven public pages show an error inside the site layout.

## User panel

Writes that touch several tables go through SQL functions, so a website is created or copied completely or not at all (`create_website`, `duplicate_website`). They are security invoker, so RLS still applies.

`/preview/sites/<id>` shows the private draft, built by `buildDraftDocument` from the database rows and the code-level theme. It is not cached, and RLS returns nothing for anyone who may not read the website.

Images upload straight from the browser to the `user-media` bucket, because server actions have a small body limit. The bucket limits type and size, and RLS confines each user to their own folder. SVG is not allowed, because SVG files can contain scripts.

Forms handled by `onSubmit` must set `method="post"`. A form submitted before the page hydrates would otherwise put its fields, including passwords, in the URL. A test enforces this.

New SQL functions are private by default and must be granted explicitly. A test lists every function visitors can run, so adding one to that list is a deliberate choice.

## Admin panel

Each section under `src/app/admin/(panel)` calls `requireAdmin` with its permission, and reads and writes through `admin_*` definer functions (`supabase/migrations/20261102000012_admin_panel.sql`). Each function checks the permission again and writes its audit record in the same transaction.

`AdminForm` submits through `onSubmit`, because React clears a form after an `action` prop runs, which would erase what was typed when a save fails.

Platform Settings holds only settings the product really uses, and `admin_save_settings` refuses any other key. Public pages read them through `getPlatformSettings`, which falls back to defaults if the database cannot be reached. Changes to public data clear the `PUBLIC_DATA_TAG` cache, so they appear at once.

## Website editor

`/editor/<id>` holds the whole draft in one client-side document (`src/features/editor`). Every change creates a new document through the pure functions in `state.ts`, which is what makes undo and redo simple. Fast edits to one field count as one undo step.

The canvas renders the real theme components through a React portal into an iframe. The site's responsive styles then follow the chosen device's width, while every edit updates without a reload. The iframe is created only in the browser, because a server-rendered frame can finish loading before hydration and its load event would be missed.

Autosave sends the whole document to `save_website_draft`, one save at a time, as a single transaction. `draft_revision` makes a save from an out-of-date tab fail rather than overwrite newer work, and the editor then stops saving and asks the user to reload.

Section props are saved even while invalid, so a half-finished edit is never lost. They are validated by type wherever they are rendered: the editor shows a placeholder and marks the fields, and a site skips that section. The publishing phase should stop a website from being published with such sections.

Version history stores `checkpoint` rows in `website_versions`, built from the saved rows rather than from anything the caller sends. Checkpoints are restored into the editor as a normal undoable edit. The newest 50 are kept per website, and published versions are never pruned.

## Storage

| Bucket | Access |
|---|---|
| `user-media` | Public read, so published sites can show images. Writes only inside the owner's `<user id>/` folder |
| `platform-media` | Public read. Writes need `media.manage` |
| `theme-packages` | Private. Needs `themes.manage` |

Files in `user-media` can be read by anyone who has the URL, so private files must not go there.

## Testing

`pnpm test` applies the real migrations to in-memory Postgres (PGlite) with a stub of Supabase's `auth` and `storage` schemas and its default grants, then runs queries as `anon` and `authenticated`. This does not replace testing against a real Supabase project.
