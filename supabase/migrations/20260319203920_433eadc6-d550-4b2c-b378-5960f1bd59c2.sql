
-- 1. Measurement sessions
CREATE TABLE public.project_measurement_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  technician_id UUID REFERENCES public.technicians(id),
  equipment_id UUID REFERENCES public.equipment(id),
  measurement_date DATE,
  measurement_notes TEXT,
  sketch_mode TEXT DEFAULT 'none',
  sketch_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Electrodes
CREATE TABLE public.electrodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measurement_session_id UUID NOT NULL REFERENCES public.project_measurement_sessions(id) ON DELETE CASCADE,
  electrode_code TEXT NOT NULL DEFAULT '',
  label TEXT,
  is_coupled BOOLEAN NOT NULL DEFAULT false,
  ra_value NUMERIC,
  rv_value NUMERIC,
  target_value NUMERIC,
  target_met BOOLEAN,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Pens
CREATE TABLE public.pens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measurement_session_id UUID NOT NULL REFERENCES public.project_measurement_sessions(id) ON DELETE CASCADE,
  electrode_id UUID NOT NULL REFERENCES public.electrodes(id) ON DELETE CASCADE,
  pen_code TEXT NOT NULL DEFAULT '',
  label TEXT,
  pen_depth_meters NUMERIC,
  display_photo_url TEXT,
  overview_photo_url TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Depth measurements
CREATE TABLE public.depth_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measurement_session_id UUID NOT NULL REFERENCES public.project_measurement_sessions(id) ON DELETE CASCADE,
  electrode_id UUID NOT NULL REFERENCES public.electrodes(id) ON DELETE CASCADE,
  pen_id UUID NOT NULL REFERENCES public.pens(id) ON DELETE CASCADE,
  depth_meters NUMERIC NOT NULL DEFAULT 0,
  resistance_value NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Project attachments
CREATE TABLE public.project_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measurement_session_id UUID REFERENCES public.project_measurement_sessions(id) ON DELETE SET NULL,
  attachment_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_name TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_measurement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depth_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Users can view measurement sessions in their tenant" ON public.project_measurement_sessions FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert measurement sessions in their tenant" ON public.project_measurement_sessions FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update measurement sessions in their tenant" ON public.project_measurement_sessions FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete measurement sessions in their tenant" ON public.project_measurement_sessions FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view electrodes in their tenant" ON public.electrodes FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert electrodes in their tenant" ON public.electrodes FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update electrodes in their tenant" ON public.electrodes FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete electrodes in their tenant" ON public.electrodes FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view pens in their tenant" ON public.pens FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert pens in their tenant" ON public.pens FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update pens in their tenant" ON public.pens FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete pens in their tenant" ON public.pens FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view depth measurements in their tenant" ON public.depth_measurements FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert depth measurements in their tenant" ON public.depth_measurements FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update depth measurements in their tenant" ON public.depth_measurements FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete depth measurements in their tenant" ON public.depth_measurements FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view attachments in their tenant" ON public.project_attachments FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert attachments in their tenant" ON public.project_attachments FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update attachments in their tenant" ON public.project_attachments FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete attachments in their tenant" ON public.project_attachments FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Dev anon policies (temporary for development)
CREATE POLICY "dev_anon_read_sessions" ON public.project_measurement_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_write_sessions" ON public.project_measurement_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_sessions" ON public.project_measurement_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_delete_sessions" ON public.project_measurement_sessions FOR DELETE TO anon USING (true);

CREATE POLICY "dev_anon_read_electrodes" ON public.electrodes FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_write_electrodes" ON public.electrodes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_electrodes" ON public.electrodes FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_delete_electrodes" ON public.electrodes FOR DELETE TO anon USING (true);

CREATE POLICY "dev_anon_read_pens" ON public.pens FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_write_pens" ON public.pens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_pens" ON public.pens FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_delete_pens" ON public.pens FOR DELETE TO anon USING (true);

CREATE POLICY "dev_anon_read_depths" ON public.depth_measurements FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_write_depths" ON public.depth_measurements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_depths" ON public.depth_measurements FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_delete_depths" ON public.depth_measurements FOR DELETE TO anon USING (true);

CREATE POLICY "dev_anon_read_attachments" ON public.project_attachments FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_write_attachments" ON public.project_attachments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_attachments" ON public.project_attachments FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_delete_attachments" ON public.project_attachments FOR DELETE TO anon USING (true);

-- Updated_at triggers
CREATE TRIGGER update_measurement_sessions_updated_at BEFORE UPDATE ON public.project_measurement_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_electrodes_updated_at BEFORE UPDATE ON public.electrodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pens_updated_at BEFORE UPDATE ON public.pens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depth_measurements_updated_at BEFORE UPDATE ON public.depth_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create measurement-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('measurement-photos', 'measurement-photos', true);

-- Storage RLS policies
CREATE POLICY "Anyone can read measurement photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'measurement-photos');
CREATE POLICY "Anon can upload measurement photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'measurement-photos');
CREATE POLICY "Anon can update measurement photos" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'measurement-photos');
CREATE POLICY "Anon can delete measurement photos" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'measurement-photos');
