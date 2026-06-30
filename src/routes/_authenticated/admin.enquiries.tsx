import { createFileRoute } from "@tanstack/react-router";
import { Check, Ban } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, StatusBadge, type Field, type Column } from "@/components/admin/ResourceManager";
import { setStatus } from "@/lib/admin/data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/enquiries")({ component: Enquiries });

const fields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "text" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "subject", label: "Subject", type: "text" },
  { name: "status", label: "Status", type: "select", options: ["pending", "resolved", "spam"], default: "pending" },
  { name: "message", label: "Message", type: "textarea" },
  { name: "notes", label: "Internal Notes", type: "textarea" },
];
const columns: Column[] = [
  { name: "name", label: "From", render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.email || r.phone}</p></div> },
  { name: "subject", label: "Subject" },
  { name: "message", label: "Message", render: (r) => <span className="line-clamp-2 max-w-xs text-xs text-muted-foreground">{r.message}</span> },
  { name: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
];

function Enquiries() {
  const quick = async (id: string, status: string, reload: () => void) => {
    try { await setStatus("enquiries", id, { status }); toast.success(`Marked ${status}`); reload(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div>
      <PageTitle title="Contact & Enquiries" subtitle="Guest messages from the website" />
      <ResourceManager table="enquiries" fields={fields} columns={columns} searchKeys={["name", "email", "subject", "message"]}
        rowActions={(row, reload) => (
          <>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#2E7D32]" title="Resolve" onClick={() => quick(row.id, "resolved", reload)}><Check className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#C62828]" title="Spam" onClick={() => quick(row.id, "spam", reload)}><Ban className="h-4 w-4" /></Button>
          </>
        )} />
    </div>
  );
}