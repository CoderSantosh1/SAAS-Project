// Mirrors public.admin_permissions. The database is what enforces these; this list
// gives server code and navigation typed keys.
export const PERMISSIONS = [
  "users.view",
  "users.manage",
  "categories.manage",
  "themes.manage",
  "templates.manage",
  "websites.view",
  "websites.moderate",
  "media.manage",
  "media.view_user",
  "domains.manage",
  "analytics.view",
  "plans.manage",
  "support.manage",
  "activity_logs.view",
  "settings.manage",
  "themes.download_code",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AdminAccess = {
  isSuper: boolean;
  roles: string[];
  permissions: string[];
};

export function can(access: AdminAccess, permission: Permission) {
  return access.isSuper || access.permissions.includes(permission);
}
