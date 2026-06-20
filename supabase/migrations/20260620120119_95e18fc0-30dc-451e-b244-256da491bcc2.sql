
CREATE TABLE public.project_diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measurement_session_id uuid REFERENCES public.project_measurement_sessions(id) ON DELETE SET NULL,
  diagram_json jsonb NOT NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_diagrams_project ON public.project_diagrams(project_id);
CREATE INDEX idx_project_diagrams_tenant ON public.project_diagrams(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_diagrams TO authenticated;
GRANT ALL ON public.project_diagrams TO service_role;

ALTER TABLE public.project_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant select diagrams" ON public.project_diagrams
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant insert diagrams" ON public.project_diagrams
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant update diagrams" ON public.project_diagrams
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant delete diagrams" ON public.project_diagrams
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE TRIGGER trg_project_diagrams_updated
  BEFORE UPDATE ON public.project_diagrams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for project-files bucket scoped to {tenant_id}/...
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='tenant read project-files') THEN
    CREATE POLICY "tenant read project-files" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='tenant write project-files') THEN
    CREATE POLICY "tenant write project-files" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='tenant update project-files') THEN
    CREATE POLICY "tenant update project-files" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='tenant delete project-files') THEN
    CREATE POLICY "tenant delete project-files" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text);
  END IF;
END $$;
