import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/admin/data";
import { Button } from "@/components/ui/button";

export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative">
          <img src={value} alt="preview" className="h-16 w-24 rounded-lg border border-black/10 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C62828] text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-black/15 text-xs text-muted-foreground">
          No image
        </div>
      )}
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
        {value ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}
