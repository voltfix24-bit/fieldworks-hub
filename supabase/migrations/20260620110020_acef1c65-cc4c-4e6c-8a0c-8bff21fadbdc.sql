
-- =============================================================
-- 1. DROP all dev_anon_* policies on public tables
-- =============================================================
DROP POLICY IF EXISTS "dev_anon_read_clients" ON public.clients;
DROP POLICY IF EXISTS "dev_anon_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "dev_anon_update_clients" ON public.clients;

DROP POLICY IF EXISTS "dev_anon_read_projects" ON public.projects;
DROP POLICY IF EXISTS "dev_anon_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "dev_anon_update_projects" ON public.projects;
DROP POLICY IF EXISTS "dev_anon_delete_projects" ON public.projects;

DROP POLICY IF EXISTS "dev_anon_read_technicians" ON public.technicians;
DROP POLICY IF EXISTS "dev_anon_insert_technicians" ON public.technicians;
DROP POLICY IF EXISTS "dev_anon_update_technicians" ON public.technicians;

DROP POLICY IF EXISTS "dev_anon_read_equipment" ON public.equipment;
DROP POLICY IF EXISTS "dev_anon_insert_equipment" ON public.equipment;
DROP POLICY IF EXISTS "dev_anon_update_equipment" ON public.equipment;

DROP POLICY IF EXISTS "dev_anon_read_electrodes" ON public.electrodes;
DROP POLICY IF EXISTS "dev_anon_write_electrodes" ON public.electrodes;
DROP POLICY IF EXISTS "dev_anon_update_electrodes" ON public.electrodes;
DROP POLICY IF EXISTS "dev_anon_delete_electrodes" ON public.electrodes;

DROP POLICY IF EXISTS "dev_anon_read_pens" ON public.pens;
DROP POLICY IF EXISTS "dev_anon_write_pens" ON public.pens;
DROP POLICY IF EXISTS "dev_anon_update_pens" ON public.pens;
DROP POLICY IF EXISTS "dev_anon_delete_pens" ON public.pens;

DROP POLICY IF EXISTS "dev_anon_read_depths" ON public.depth_measurements;
DROP POLICY IF EXISTS "dev_anon_write_depths" ON public.depth_measurements;
DROP POLICY IF EXISTS "dev_anon_update_depths" ON public.depth_measurements;
DROP POLICY IF EXISTS "dev_anon_delete_depths" ON public.depth_measurements;

DROP POLICY IF EXISTS "dev_anon_read_attachments" ON public.project_attachments;
DROP POLICY IF EXISTS "dev_anon_write_attachments" ON public.project_attachments;
DROP POLICY IF EXISTS "dev_anon_update_attachments" ON public.project_attachments;
DROP POLICY IF EXISTS "dev_anon_delete_attachments" ON public.project_attachments;

DROP POLICY IF EXISTS "dev_anon_read_sessions" ON public.project_measurement_sessions;
DROP POLICY IF EXISTS "dev_anon_write_sessions" ON public.project_measurement_sessions;
DROP POLICY IF EXISTS "dev_anon_update_sessions" ON public.project_measurement_sessions;
DROP POLICY IF EXISTS "dev_anon_delete_sessions" ON public.project_measurement_sessions;

DROP POLICY IF EXISTS "dev_anon_read_branding" ON public.tenant_branding;
DROP POLICY IF EXISTS "dev_anon_insert_branding" ON public.tenant_branding;
DROP POLICY IF EXISTS "dev_anon_update_branding" ON public.tenant_branding;

DROP POLICY IF EXISTS "dev_anon_read_tenants" ON public.tenants;
DROP POLICY IF EXISTS "dev_anon_update_tenants" ON public.tenants;

DROP POLICY IF EXISTS "dev_anon_read_profiles" ON public.profiles;

-- Revoke any leftover privileges on public tables for anon
REVOKE ALL ON public.clients, public.projects, public.technicians, public.equipment,
              public.electrodes, public.pens, public.depth_measurements,
              public.project_attachments, public.project_measurement_sessions,
              public.tenant_branding, public.tenants, public.profiles, public.user_roles
FROM anon;

-- =============================================================
-- 2. STORAGE: drop unsafe anon / open policies
-- =============================================================
DROP POLICY IF EXISTS "Anon can delete measurement photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon can update measurement photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload measurement photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read measurement photos" ON storage.objects;

DROP POLICY IF EXISTS "Anon can read project files" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload project files" ON storage.objects;

DROP POLICY IF EXISTS "Anon can read reports (dev)" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload reports (dev)" ON storage.objects;

DROP POLICY IF EXISTS "Anon can delete tenant assets" ON storage.objects;
DROP POLICY IF EXISTS "Anon can update tenant assets" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload tenant assets" ON storage.objects;

-- =============================================================
-- 3. STORAGE: tenant-scoped authenticated policies
--    Path convention used by the app: {tenant_id}/...
-- =============================================================

-- measurement-photos (will be flipped to private bucket after this migration)
CREATE POLICY "auth_select_measurement_photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'measurement-photos'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );
CREATE POLICY "auth_insert_measurement_photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'measurement-photos'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );
CREATE POLICY "auth_update_measurement_photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'measurement-photos'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );
CREATE POLICY "auth_delete_measurement_photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'measurement-photos'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );

-- project-files: keep existing SELECT/INSERT (authenticated, bucket-scoped), add UPDATE/DELETE
CREATE POLICY "Auth users can update project files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files');
CREATE POLICY "Auth users can delete project files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files');

-- generated-reports: add UPDATE/DELETE for authenticated
CREATE POLICY "Auth users can update reports"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'generated-reports');
CREATE POLICY "Auth users can delete reports"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'generated-reports');

-- tenant-assets stays a public-read bucket (logos in <img>),
-- but writes are tenant-scoped:
DROP POLICY IF EXISTS "Authenticated users can upload tenant assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update tenant assets" ON storage.objects;
CREATE POLICY "auth_insert_tenant_assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );
CREATE POLICY "auth_update_tenant_assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );
CREATE POLICY "auth_delete_tenant_assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  );
