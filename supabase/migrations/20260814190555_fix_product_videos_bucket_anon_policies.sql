/*
# Fix product-videos bucket RLS policies for anon access

## Problem
The app's Supabase client uses the anon key (no Supabase Auth session).
The storage INSERT policy on the `product-videos` bucket was scoped to
`TO authenticated` only, so anon-key uploads failed with:
"new row violates row-level security policy".

## Fix
Recreates all four CRUD policies on storage.objects for the
`product-videos` bucket with `TO anon, authenticated` so the anon-key
frontend client can upload, read, update, and delete product videos.

## Security
The bucket is public (readable by anyone), which is required so that
Green API's sendFileByUrl endpoint can fetch the files. Write access
is limited to anon + authenticated (the app's client roles).
*/

DROP POLICY IF EXISTS "Authenticated can upload product videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product videos" ON storage.objects;

CREATE POLICY "anon_authed can upload product videos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'product-videos');

CREATE POLICY "anon_authed can update product videos"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'product-videos')
  WITH CHECK (bucket_id = 'product-videos');

CREATE POLICY "anon_authed can read product videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-videos');

CREATE POLICY "anon_authed can delete product videos"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'product-videos');
