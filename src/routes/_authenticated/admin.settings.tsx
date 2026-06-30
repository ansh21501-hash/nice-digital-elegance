import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, type Field, type Column } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

const fields: Field[] = [
  { name: "key", label: "Setting Key", type: "text", required: true, placeholder: "e.g. hotel_phone" },
  { name: "label", label: "Label", type: "text" },
  { name: "group", label: "Group", type: "select", options: ["general", "contact", "social", "smtp", "payment", "seo", "theme"], default: "general" },
  { name: "value", label: "Value", type: "textarea", fullWidth: true },
];
const columns: Column[] = [
  { name: "label", label: "Setting", render: (r) => <div><p className="font-medium">{r.label || r.key}</p><p className="text-xs text-muted-foreground">{r.key}</p></div> },
  { name: "group", label: "Group", render: (r) => <span className="capitalize">{r.group}</span> },
  { name: "value", label: "Value", render: (r) => <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground">{r.value}</span> },
];

function Settings() {
  return (
    <div>
      <PageTitle title="Settings" subtitle="Hotel info, contact, SMTP, payment, SEO & theme" />
      <ResourceManager table="site_settings" fields={fields} columns={columns} orderBy="key" ascending searchKeys={["key", "label", "group"]} />
    </div>
  );
}