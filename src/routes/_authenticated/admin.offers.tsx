import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, type Field, type Column } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/offers")({ component: Offers });

const fields: Field[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "code", label: "Promo Code", type: "text" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: ["room", "restaurant", "homepage", "seasonal", "flash"],
  },
  { name: "discount", label: "Discount (%/₹)", type: "text" },
  { name: "starts_at", label: "Starts", type: "date" },
  { name: "ends_at", label: "Expires", type: "date" },
  { name: "is_active", label: "Published", type: "boolean", default: true },
  { name: "image", label: "Banner Image", type: "image", fullWidth: true },
  { name: "description", label: "Description", type: "textarea" },
];
const columns: Column[] = [
  { name: "title", label: "Offer" },
  { name: "code", label: "Code" },
  { name: "type", label: "Type", render: (r) => <span className="capitalize">{r.type}</span> },
  { name: "discount", label: "Discount" },
  { name: "ends_at", label: "Expires" },
  { name: "is_active", label: "Live", render: (r) => (r.is_active ? "Yes" : "No") },
];

function Offers() {
  return (
    <div>
      <PageTitle
        title="Offer Management"
        subtitle="Coupons, banners, flash sales & seasonal packages"
      />
      <ResourceManager
        table="offers"
        fields={fields}
        columns={columns}
        searchKeys={["title", "code"]}
      />
    </div>
  );
}
