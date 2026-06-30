import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Generic admin CRUD operates over many tables; use a loosely-typed handle
// so dynamic column maps compile against the strict generated types.
const db = supabase as unknown as {
  from: (t: string) => any;
  auth: typeof supabase.auth;
};

export type TableName =
  | "bookings"
  | "rooms"
  | "menu_categories"
  | "menu_items"
  | "offers"
  | "enquiries"
  | "reviews"
  | "gallery"
  | "profiles"
  | "user_roles"
  | "audit_logs"
  | "site_settings";

export function useRows<T = Record<string, unknown>>(
  table: TableName,
  opts?: { orderBy?: string; ascending?: boolean }
) {
  return useQuery({
    queryKey: [table, opts?.orderBy, opts?.ascending],
    queryFn: async () => {
      let q = db.from(table).select("*");
      if (opts?.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (table: TableName) => qc.invalidateQueries({ queryKey: [table] });
}

export async function logAudit(action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await db.from("audit_logs").insert({
    user_id: data.user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? {},
  });
}

export async function upsertRow(table: TableName, values: Record<string, unknown>, id?: string) {
  if (id) {
    const { error } = await db.from(table).update(values).eq("id", id);
    if (error) throw error;
    await logAudit("update", table, id);
  } else {
    const { data, error } = await db.from(table).insert(values).select("id").single();
    if (error) throw error;
    await logAudit("create", table, (data as { id?: string } | null)?.id);
  }
}

export async function deleteRow(table: TableName, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
  await logAudit("delete", table, id);
}

export async function setStatus(table: TableName, id: string, patch: Record<string, unknown>) {
  const { error } = await db.from(table).update(patch).eq("id", id);
  if (error) throw error;
  await logAudit("status", table, id, patch);
}