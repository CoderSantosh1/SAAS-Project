import "server-only";
import { can, type AdminAccess, type Permission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

type Stat = { label: string; value: number };

type StatDefinition = {
  label: string;
  table: string;
  permission: Permission;
  filter?: [column: string, value: string];
};

const STATS: StatDefinition[] = [
  { label: "Total users", table: "profiles", permission: "users.view" },
  { label: "Active users", table: "profiles", permission: "users.view", filter: ["account_status", "active"] },
  { label: "Suspended users", table: "profiles", permission: "users.view", filter: ["account_status", "suspended"] },
  { label: "Total websites", table: "websites", permission: "websites.view" },
  { label: "Published websites", table: "websites", permission: "websites.view", filter: ["status", "published"] },
  { label: "Draft websites", table: "websites", permission: "websites.view", filter: ["status", "draft"] },
  { label: "Themes", table: "themes", permission: "themes.manage" },
  { label: "Templates", table: "templates", permission: "templates.manage" },
  { label: "Categories", table: "categories", permission: "categories.manage" },
];

// Counts only what this admin may see. Without the permission RLS would return a
// partial number, which is worse than showing nothing.
export async function getAdminOverviewStats(access: AdminAccess): Promise<Stat[]> {
  const supabase = await createClient();

  return Promise.all(
    STATS.filter((stat) => can(access, stat.permission)).map(async ({ label, table, filter }) => {
      let query = supabase.from(table).select("id", { count: "exact", head: true });
      if (filter) query = query.eq(filter[0], filter[1]);

      const { count, error } = await query;
      if (error) throw new Error(`Could not load ${label}: ${error.message}`);
      return { label, value: count ?? 0 };
    }),
  );
}
