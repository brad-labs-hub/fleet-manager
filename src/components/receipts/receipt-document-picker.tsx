"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { isReceiptDocumentFile } from "@/lib/receipt-documents";
import { getSecureDocumentHref } from "@/lib/document-links";

type Props = {
  label: string;
  hint?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingUrls?: string[];
  variant?: "dropzone" | "compact";
};

export function ReceiptDocumentPicker({
  label,
  hint,
  files,
  onFilesChange,
  existingUrls = [],
  variant = "dropzone",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(selected: FileList | null) {
    const allowed = Array.from(selected ?? []).filter(isReceiptDocumentFile);
    if (allowed.length === 0) return;
    onFilesChange([...files, ...allowed]);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {existingUrls.length > 0 && (
        <ul className="space-y-1">
          {existingUrls.map((url, i) => (
            <li key={url}>
              <a
                href={getSecureDocumentHref(url)}
                className="text-sm text-primary underline underline-offset-2"
              >
                View saved document{i > 0 ? ` ${i + 1}` : ""}
              </a>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,application/pdf,image/*"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {variant === "dropzone" ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-10 px-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-colors text-foreground"
        >
          <Upload className="w-10 h-10 text-primary" />
          <span className="font-medium">
            {files.length === 0 ? "Tap to add receipt files" : "Add more files"}
          </span>
          <span className="text-sm text-muted-foreground text-center px-2">
            PDF, JPG or PNG — select one or many
          </span>
        </button>
      ) : (
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          Add files (PDF, JPG, PNG)
        </Button>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.lastModified}-${i}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
            >
              <FileText className="w-6 h-6 text-primary shrink-0" />
              <span className="flex-1 min-w-0 truncate text-sm text-foreground">{f.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(i)}
                className="shrink-0"
                aria-label={`Remove ${f.name}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
