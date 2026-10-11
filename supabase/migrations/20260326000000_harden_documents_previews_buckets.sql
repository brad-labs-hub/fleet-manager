-- Harden the `documents` and `vehicle-previews` buckets for production.
-- Previously created with public = true, which exposes insurance docs,
-- registrations, and vehicle photos to anyone holding an object URL.
-- The authenticated SELECT policies remain in place, and app access is
-- proxied through /api/storage/open, so flipping these private closes the
-- public-URL gap without breaking authenticated reads.
UPDATE storage.buckets
SET public = false
WHERE id IN ('documents', 'vehicle-previews');
