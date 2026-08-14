/*
# Create product-videos storage bucket

1. Storage
- Creates a public storage bucket named `product-videos` for storing MP4
  product demonstration videos.
- The bucket is public so that direct URLs can be used with Green API's
  sendFileByUrl endpoint without signed-URL expiry concerns.

2. Security
- Storage buckets do not use table RLS. Access is controlled via storage policies.
- INSERT/UPDATE: allowed for authenticated users (admins/technicians).
- SELECT/READ: allowed for everyone (public bucket) so Green API can fetch the file.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can upload product videos" ON storage.objects;
CREATE POLICY "Authenticated can upload product videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Authenticated can update product videos" ON storage.objects;
CREATE POLICY "Authenticated can update product videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Public can read product videos" ON storage.objects;
CREATE POLICY "Public can read product videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Authenticated can delete product videos" ON storage.objects;
CREATE POLICY "Authenticated can delete product videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-videos');
