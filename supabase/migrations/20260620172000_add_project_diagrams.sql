CREATE TABLE IF NOT EXISTS public.project_diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measurement_session_id UUID REFERENCES public.project_measurement_sessions(id) ON DELETE SET NULL,
  diagram_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_diagrams ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_project_diagrams_tenant_project
  ON public.project_diagrams (tenant_id, project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_diagrams_session
  ON public.project_diagrams (measurement_session_id)
  WHERE measurement_session_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_project_diagrams_updated_at ON public.project_diagrams;
CREATE TRIGGER update_project_diagrams_updated_at
  BEFORE UPDATE ON public.project_diagrams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Tenant users can read project diagrams" ON public.project_diagrams;
DROP POLICY IF EXISTS "Tenant users can create project diagrams" ON public.project_diagrams;
DROP POLICY IF EXISTS "Tenant users can update project diagrams" ON public.project_diagrams;
DROP POLICY IF EXISTS "Tenant admins can delete project diagrams" ON public.project_diagrams;

CREATE POLICY "Tenant users can read project diagrams"
  ON public.project_diagrams
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can create project diagrams"
  ON public.project_diagrams
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can update project diagrams"
  ON public.project_diagrams
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can delete project diagrams"
  ON public.project_diagrams
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'tenant_admin')
  );
