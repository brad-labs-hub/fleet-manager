export function getSecureDocumentHref(documentUrl: string): string {
  return `/api/storage/open?documentUrl=${encodeURIComponent(documentUrl)}`;
}
