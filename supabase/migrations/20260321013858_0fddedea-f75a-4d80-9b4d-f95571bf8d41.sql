DROP POLICY IF EXISTS "Tenant admins can update their tenant" ON public.tenants;

CREATE POLICY "Tenant members can update their tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (id = get_user_tenant_id(auth.uid()))
WITH CHECK (id = get_user_tenant_id(auth.uid()));