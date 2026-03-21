CREATE POLICY "Anon can upload tenant assets"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'tenant-assets');

CREATE POLICY "Anon can update tenant assets"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'tenant-assets');

CREATE POLICY "Anon can delete tenant assets"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'tenant-assets');