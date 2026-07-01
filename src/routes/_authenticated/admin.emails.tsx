import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCw, Search, Download, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/ResourceManager";
import { useRows, useInvalidate } from "@/lib/admin/data";
import { adminResendEmail } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/emails")({ component: EmailCenter });

type Log = {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  status: string;
  retries: number;
  error_message?: string | null;
  created_at: string;
};

const FILTERS = ["all", "sent", "pending", "failed"] as const;

function EmailCenter() {
  const { data = [], isLoading } = useRows<Log>("email_logs", {
    orderBy: "created_at",
    ascending: false,
  });
  const invalidate = useInvalidate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [resending, setResending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const lc = q.toLowerCase();
    return data.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!lc) return true;
      return [r.recipient, r.subject, r.type].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(lc),
      );
    });
  }, [data, q, filter]);

  const counts = useMemo(
    () => ({
      all: data.length,
      sent: data.filter((r) => r.status === "sent").length,
      pending: data.filter((r) => r.status === "pending").length,
      failed: data.filter((r) => r.status === "failed").length,
    }),
    [data],
  );

  const resend = async (id: string) => {
    setResending(id);
    try {
      const { ok } = await adminResendEmail({ data: { id } });
      toast[ok ? "success" : "error"](ok ? "Email resent" : "Resend failed");
      invalidate("email_logs");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setResending(null);
    }
  };

  const exportCsv = () => {
    const head = ["Recipient", "Subject", "Type", "Status", "Retries", "Error", "Time"];
    const rows = filtered.map((r) =>
      [r.recipient, r.subject, r.type, r.status, r.retries, r.error_message ?? "", r.created_at]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageTitle
        title="Email Center"
        subtitle="Monitor, search and resend every email sent by the website"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => invalidate("email_logs")}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs capitalize transition ${filter === f ? "bg-[#B98A3E] text-white" : "border border-black/10 text-muted-foreground hover:border-[#B98A3E]"}`}
          >
            {f} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipient, subject..."
            className="w-full rounded-full border border-black/10 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[#B98A3E]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 bg-[#FAFAF8] text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No emails found.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8]">
                <td className="px-4 py-3 font-medium">{r.recipient}</td>
                <td className="px-4 py-3 max-w-xs">
                  <span className="line-clamp-1">{r.subject}</span>
                  {r.error_message && (
                    <span className="mt-0.5 block text-[11px] text-red-500 line-clamp-1">
                      {r.error_message}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px]">{r.type}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={r.status} />
                  {r.retries > 0 && (
                    <span className="ml-1 text-[10px] text-muted-foreground">×{r.retries}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-[#B98A3E]"
                    disabled={resending === r.id}
                    onClick={() => resend(r.id)}
                  >
                    {resending === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-1 h-3.5 w-3.5" />
                        Resend
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
