"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, ExternalLink, Printer, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

type ViewerFileType = "pdf" | "image";

type DocumentViewerProps = {
  title: string;
  streamUrl: string;
  fileType: ViewerFileType;
  backTo: string;
};

export function DocumentViewer({
  title,
  streamUrl,
  fileType,
  backTo,
}: DocumentViewerProps) {
  const [sharing, setSharing] = useState(false);
  const defaultLayout = useMemo(() => defaultLayoutPlugin(), []);

  async function handleShare() {
    setSharing(true);
    try {
      const shareTarget = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title,
          url: shareTarget,
        });
        return;
      }
      await navigator.clipboard.writeText(shareTarget);
      alert("Viewer link copied to clipboard");
    } catch {
      // User cancelled or copy failed.
    } finally {
      setSharing(false);
    }
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = streamUrl;
    link.download = title;
    link.click();
  }

  function handlePrint() {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.src = streamUrl;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
    document.body.appendChild(iframe);
    setTimeout(() => {
      iframe.remove();
    }, 30000);
  }

  function handleOpenNewTab() {
    window.open(streamUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <Link
                href={backTo}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Link>
              <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
              <p className="text-xs text-muted-foreground">
                Secure in-app viewer with print, download, and share controls
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={sharing}
                className="cursor-pointer"
              >
                <Share2 className="mr-1.5 h-4 w-4" />
                {sharing ? "Sharing..." : "Share"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer"
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="cursor-pointer"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenNewTab}
                className="cursor-pointer"
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Open in new tab
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {fileType === "pdf" ? (
            <div className="h-[calc(100vh-15rem)] min-h-[680px]">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={streamUrl} plugins={[defaultLayout]} />
              </Worker>
            </div>
          ) : (
            <div className="flex min-h-[680px] items-center justify-center bg-muted/20 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={streamUrl}
                alt={title}
                className="max-h-[calc(100vh-18rem)] max-w-full rounded-md object-contain shadow-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
