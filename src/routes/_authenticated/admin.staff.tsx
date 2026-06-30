import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, StatusBadge, type Field, type Column } from "@/components/admin/ResourceManager";
import { useRows } from "@/lib/admin/data";
import { useAdminAuth } from "@/lib/admin/auth";

export const Route = createFileRoute("/_authenticated/admin/staff")({ component: Staff });

const ROLES = ["super_admin", "hotel_manager", "restaurant_manager", "event_manager", "reception_staff", "content_manager", "accountant", "support_staff"];

function Staff() {
  const { isSuperAdmin } = useAdminAuth();
  const { data: profiles = [] } = useRows<any>("profiles");

  const fields: Field[] = [
    { name: "user_id", label: "User ID (auth uid)", type: "select", options: profiles.map((p) => ({ value: p.id, label: `${p.full_name || p.email || p.id}` })), required: true, fullWidth: true },
    { name: "role", label: "Role", type: "select", options: ROLES, required: true },
  ];
  const columns: Column[] = [
    { name: "user_id", label: "User", render: (r) => { const p = profiles.find((x) => x.id === r.user_id); return <div><p className="font-medium">{p?.full_name || p?.email || r.user_id}</p><p className="text-xs text-muted-foreground">{p?.email}</p></div>; } },
    { name: "role", label: "Role", render: (r) => <StatusBadge value={String(r.role).replace(/_/g, " ")} /> },
  ];

  return (
    <div>
      <PageTitle title="Staff & Roles" subtitle="Assign role-based access to team members" />
      {!isSuperAdmin && <p className="mb-4 rounded-xl bg-[#F9A825]/10 px-4 py-3 text-sm text-[#a37800]">Only Super Admins can modify roles.</p>}
      <ResourceManager table="user_roles" fields={fields} columns={columns} canEdit={isSuperAdmin} searchKeys={["role"]} />
    </div>
  );
}