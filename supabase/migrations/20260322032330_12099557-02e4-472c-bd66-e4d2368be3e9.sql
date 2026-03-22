INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload project files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Auth users can read project files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-files');
CREATE POLICY "Anon can upload project files" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Anon can read project files" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'project-files');