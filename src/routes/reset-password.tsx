import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset Password" }, { name: "robots", content: "noindex" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/admin", replace: true });
    } catch (err: any) { toast.error(err.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#161616] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
        <h1 className="mb-6 text-center font-display text-2xl text-white">Set a new password</h1>
        <Label className="mb-1.5 block text-xs text-white/70">New password</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="border-white/15 bg-white/5 text-white" />
        <Button type="submit" disabled={loading} className="mt-5 w-full bg-[#B98A3E] text-white hover:bg-[#a2772f]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update Password
        </Button>
      </form>
    </div>
  );
}