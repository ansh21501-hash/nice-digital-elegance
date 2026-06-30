import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, type Field, type Column } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/events")({ component: Events });

const fields: Field[] = [
  { name: "name", label: "Venue Name", type: "text", required: true },
  { name: "subtitle", label: "Subtitle", type: "text" },
  { name: "badge", label: "Badge", type: "text" },
  { name: "capacity", label: "Capacity", type: "text" },
  { name: "size", label: "Size", type: "text" },
  { name: "floor", label: "Floor", type: "text" },
  { name: "price", label: "Price", type: "text" },
  { name: "amenities", label: "Amenities", type: "tags" },
  { name: "sort_order", label: "Display Order", type: "number", default: 0 },
  { name: "coming_soon", label: "Coming Soon", type: "boolean", default: false },
  { name: "is_active", label: "Published", type: "boolean", default: true },
  { name: "image", label: "Image URL", type: "text", fullWidth: true },
  { name: "description", label: "Description", type: "textarea", fullWidth: true },
];
const columns: Column[] = [
  { name: "name", label: "Venue" },
  { name: "subtitle", label: "Subtitle" },
  { name: "capacity", label: "Capacity" },
  { name: "sort_order", label: "Order" },
  { name: "is_active", label: "Live", render: (r) => (r.is_active ? "Yes" : "No") },
];

function Events() {
  return (
    <div>
      <PageTitle title="Venue & Events" subtitle="Manage party halls, meeting rooms and event spaces" />
      <ResourceManager table="events" fields={fields} columns={columns} searchKeys={["name", "subtitle"]} />
    </div>
  );
}
