import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentViewer } from "@/components/document-viewer";
import { getDocumentStreamHref } from "@/lib/document-links";

export const metadata: Metadata = {
  title: "Document Viewer",
  robots: {
    index: false,
    follow: false,
  },
};

type ViewerPageProps = {
  searchParams?: {
    documentUrl?: string;
    title?: string;
    backTo?: string;
  };
};

function getFileType(documentUrl: string): "pdf" | "image" {
  const path = documentUrl.split("?")[0].toLowerCase();
  if (path.endsWith(".pdf")) return "pdf";
  return "image";
}

function getSafeBackTo(backTo: string | undefined): string {
  if (!backTo) return "/admin/dashboard";
  if (!backTo.startsWith("/")) return "/admin/dashboard";
  return backTo;
}

export default async function DocumentViewerPage({ searchParams }: ViewerPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const documentUrl = searchParams?.documentUrl;
  if (!documentUrl) redirect("/admin/dashboard");

  const title =
    searchParams?.title ||
    decodeURIComponent(documentUrl.split("/").pop() || "Document");
  const backTo = getSafeBackTo(searchParams?.backTo);
  const fileType = getFileType(documentUrl);
  const streamUrl = getDocumentStreamHref(documentUrl);

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <DocumentViewer
        title={title}
        streamUrl={streamUrl}
        fileType={fileType}
        backTo={backTo}
      />
    </div>
  );
}
