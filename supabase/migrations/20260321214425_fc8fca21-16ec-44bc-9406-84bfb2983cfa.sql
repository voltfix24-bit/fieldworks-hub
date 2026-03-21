
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-reports', 'generated-reports', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'generated-reports');
CREATE POLICY "Authenticated users can read reports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'generated-reports');
CREATE POLICY "Anon can upload reports (dev)" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'generated-reports');
CREATE POLICY "Anon can read reports (dev)" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'generated-reports');
