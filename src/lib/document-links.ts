type ViewerOptions = {
  title?: string;
  backTo?: string;
};

export function getDocumentStreamHref(documentUrl: string): string {
  return `/api/storage/open?documentUrl=${encodeURIComponent(documentUrl)}`;
}

export function getDocumentViewerHref(
  documentUrl: string,
  options?: ViewerOptions
): string {
  const params = new URLSearchParams();
  params.set("documentUrl", documentUrl);
  if (options?.title) params.set("title", options.title);
  if (options?.backTo) params.set("backTo", options.backTo);
  return `/documents/viewer?${params.toString()}`;
}

// Backward-compatible helper used across existing pages.
export function getSecureDocumentHref(
  documentUrl: string,
  options?: ViewerOptions
): string {
  return getDocumentViewerHref(documentUrl, options);
}
