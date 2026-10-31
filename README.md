# WEB

Your Website. Your Vision. A multi-tenant, no-code website builder.

The product name lives in `src/config/brand.ts`. See [docs/architecture.md](docs/architecture.md) for how the system fits together.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a project at [supabase.com](https://supabase.com), then copy the env template and fill it in from Project Settings > API:

   ```bash
   cp .env.example .env.local
   ```

3. Apply the database migrations:

   ```bash
   pnpm exec supabase login
   ```

   ```bash
   pnpm exec supabase link --project-ref <your-project-ref>
   ```

   ```bash
   pnpm exec supabase db push
   ```

4. In Supabase > Authentication > URL Configuration, set the Site URL and add `http://localhost:3000/auth/callback` to the redirect URLs.

5. Start the app and register your own account at `/register`:

   ```bash
   pnpm dev
   ```

6. Make that account the first Super Admin by running this in the Supabase SQL editor:

   ```sql
   select public.grant_super_admin('you@example.com');
   ```

   Then sign in at `/admin/login`. Further admin roles are assigned by a Super Admin.

## Troubleshooting

If pages fail with `fetch failed` and `unable to verify the first certificate`, Node does not trust a certificate that Windows does, which antivirus or a corporate network can cause. Make Node use the system certificate store instead of turning off TLS checks. In PowerShell:

```powershell
$env:NODE_OPTIONS="--use-system-ca"; pnpm dev
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm test` | Run the migrations and RLS tests on in-memory Postgres, plus unit tests |
| `pnpm typecheck` | Check types |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Build for production |
