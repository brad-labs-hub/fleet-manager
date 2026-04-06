import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getSecureDocumentHref } from "@/lib/document-links";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("*, vehicle:vehicles(make, model, year)")
    .eq("id", id)
    .single();

  if (error || !receipt) notFound();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/driver/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">Receipt</h1>
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span className="capitalize">{receipt.category?.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatCurrency(Number(receipt.amount))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(receipt.date)}</span>
          </div>
          {receipt.vendor && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor</span>
              <span>{receipt.vendor}</span>
            </div>
          )}
          {receipt.vehicle && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              <span>
                {(receipt.vehicle as unknown as { year: number; make: string; model: string }).year}{" "}
                {(receipt.vehicle as unknown as { year: number; make: string; model: string }).make}{" "}
                {(receipt.vehicle as unknown as { year: number; make: string; model: string }).model}
              </span>
            </div>
          )}
          {receipt.notes && (
            <div>
              <span className="text-muted-foreground block mb-1">Notes</span>
              <p>{receipt.notes}</p>
            </div>
          )}
          {receipt.document_url && (
            <div>
              <a
                href={getSecureDocumentHref(receipt.document_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                View document
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
