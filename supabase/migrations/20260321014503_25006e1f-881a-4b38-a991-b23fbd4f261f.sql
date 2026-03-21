CREATE POLICY "dev_anon_update_tenants"
ON public.tenants
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);