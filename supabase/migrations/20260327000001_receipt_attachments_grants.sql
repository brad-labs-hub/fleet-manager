-- PostgREST roles + explicit RLS checks for receipt_attachments (fixes client insert failures).

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.receipt_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.receipt_attachments TO service_role;

DROP POLICY IF EXISTS "Receipt attachments: admin" ON public.receipt_attachments;

CREATE POLICY "Receipt attachments: admin"
  ON public.receipt_attachments
  FOR ALL
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
