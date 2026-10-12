import type { SupabaseClient } from "@supabase/supabase-js";
import { formatErrorMessage } from "@/lib/format-error";

export function isReceiptDocumentFile(f: File): boolean {
  if (f.type === "application/pdf" || f.type.startsWith("image/")) return true;
  const lower = f.name.toLowerCase();
  return /\.(pdf|jpe?g|png|heic|heif|webp)$/.test(lower);
}

export async function uploadReceiptDocument(
  supabase: SupabaseClient,
  file: File,
  pathPrefix: string
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${pathPrefix}/${crypto.randomUUID()}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, file, { upsert: true });
  if (uploadError) {
    throw new Error(formatErrorMessage(uploadError, "File upload failed"));
  }
  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
  return urlData.publicUrl;
}

/** Persist extra receipt files via server API (service role), after storage upload. */
export async function insertReceiptAttachmentRows(
  receiptId: string,
  urls: string[]
): Promise<void> {
  if (urls.length === 0) return;
  const res = await fetch(`/api/receipts/${receiptId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentUrls: urls }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to save attachments");
  }
}
