
-- Temporary dev policies: allow anon read access for development
CREATE POLICY "dev_anon_read_tenants" ON public.tenants FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_read_branding" ON public.tenant_branding FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_read_clients" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_read_technicians" ON public.technicians FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_read_equipment" ON public.equipment FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_read_projects" ON public.projects FOR SELECT TO anon USING (true);
CREATE POLICY "dev_anon_read_profiles" ON public.profiles FOR SELECT TO anon USING (true);

-- Allow anon write for dev
CREATE POLICY "dev_anon_insert_clients" ON public.clients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_clients" ON public.clients FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_insert_technicians" ON public.technicians FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_technicians" ON public.technicians FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_insert_equipment" ON public.equipment FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_equipment" ON public.equipment FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_insert_projects" ON public.projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_anon_update_projects" ON public.projects FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_update_branding" ON public.tenant_branding FOR UPDATE TO anon USING (true);
CREATE POLICY "dev_anon_insert_branding" ON public.tenant_branding FOR INSERT TO anon WITH CHECK (true);
