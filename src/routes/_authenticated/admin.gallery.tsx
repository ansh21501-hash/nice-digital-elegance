import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, type Field, type Column } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/gallery")({ component: Gallery });

const fields: Field[] = [
  { name: "title", label: "Title / Alt Text", type: "text", required: true },
  { name: "category", label: "Album", type: "select", options: ["homepage", "rooms", "restaurant", "venue", "general"], default: "general" },
  { name: "image_url", label: "Image URL", type: "text", required: true, fullWidth: true },
  { name: "is_featured", label: "Featured", type: "boolean", default: false },
  { name: "sort_order", label: "Sort Order", type: "number", default: 0 },
];
const columns: Column[] = [
  { name: "image_url", label: "Image", render: (r) => r.image_url ? <img src={r.image_url} alt={r.title} className="h-12 w-16 rounded-lg object-cover" /> : "—" },
  { name: "title", label: "Title" },
  { name: "category", label: "Album", render: (r) => <span className="capitalize">{r.category}</span> },
  { name: "is_featured", label: "Featured", render: (r) => r.is_featured ? "★" : "—" },
];

function Gallery() {
  return (
    <div>
      <PageTitle title="Gallery & Media Library" subtitle="Albums, featured images & alt text" />
      <ResourceManager table="gallery" fields={fields} columns={columns} orderBy="sort_order" ascending searchKeys={["title", "category"]} />
    </div>
  );
}