import type { SupabaseClient } from "@supabase/supabase-js";

export function isReceiptDocumentFile(f: File): boolean {
  return f.type === "application/pdf" || f.type.startsWith("image/");
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
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
  return urlData.publicUrl;
}

export async function insertReceiptAttachmentRows(
  supabase: SupabaseClient,
  receiptId: string,
  urls: string[]
): Promise<void> {
  if (urls.length === 0) return;
  const { error } = await supabase.from("receipt_attachments").insert(
    urls.map((document_url) => ({ receipt_id: receiptId, document_url }))
  );
  if (error) throw error;
}
