
-- Drop overly permissive policies on generated-reports bucket
DROP POLICY IF EXISTS "Authenticated users can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read reports" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload reports (dev)" ON storage.objects;
DROP POLICY IF EXISTS "Anon can read reports (dev)" ON storage.objects;

-- Tenant-scoped policies based on project_id in path: shared/{projectId}/...
CREATE POLICY "Tenant can read own generated reports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'generated-reports'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Tenant can upload generated reports for own projects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'generated-reports'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Tenant can update own generated reports"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'generated-reports'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Tenant can delete own generated reports"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'generated-reports'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);
