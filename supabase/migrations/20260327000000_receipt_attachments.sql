-- Extra files for a receipt (primary file remains receipts.document_url).
CREATE TABLE receipt_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipt_attachments_receipt ON receipt_attachments(receipt_id);

ALTER TABLE receipt_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receipt attachments: admin" ON receipt_attachments
  FOR ALL USING (is_admin_role());

CREATE POLICY "Receipt attachments: drivers read own" ON receipt_attachments
  FOR SELECT USING (
    get_user_role() = 'driver'
    AND EXISTS (
      SELECT 1 FROM receipts r
      WHERE r.id = receipt_attachments.receipt_id
        AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Receipt attachments: drivers insert own" ON receipt_attachments
  FOR INSERT WITH CHECK (
    get_user_role() = 'driver'
    AND EXISTS (
      SELECT 1 FROM receipts r
      WHERE r.id = receipt_attachments.receipt_id
        AND r.created_by = auth.uid()
    )
  );
