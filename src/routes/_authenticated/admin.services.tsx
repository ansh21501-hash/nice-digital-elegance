import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, type Field, type Column } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/services")({ component: Services });

const fields: Field[] = [
  { name: "title", label: "Service Name", type: "text", required: true },
  { name: "group_name", label: "Group", type: "select", options: ["Accommodation & Events", "Amenities & Services", "Dining & Bars"], default: "Amenities & Services" },
  { name: "icon", label: "Icon", type: "select", options: ["bed", "building", "car", "wifi", "sparkles", "bell", "utensils", "shield", "accessibility", "star", "home"], default: "sparkles" },
  { name: "tags", label: "Tags", type: "tags" },
  { name: "sort_order", label: "Display Order", type: "number", default: 0 },
  { name: "is_active", label: "Published", type: "boolean", default: true },
  { name: "description", label: "Description", type: "textarea", fullWidth: true },
];
const columns: Column[] = [
  { name: "title", label: "Service" },
  { name: "group_name", label: "Group" },
  { name: "sort_order", label: "Order" },
  { name: "is_active", label: "Live", render: (r) => (r.is_active ? "Yes" : "No") },
];

function Services() {
  return (
    <div>
      <PageTitle title="Hotel Services" subtitle="Manage amenities, dining and the services shown on the site" />
      <ResourceManager table="services" fields={fields} columns={columns} searchKeys={["title", "group_name"]} />
    </div>
  );
}
