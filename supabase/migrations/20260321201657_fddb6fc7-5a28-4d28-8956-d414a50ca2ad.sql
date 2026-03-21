-- Verwijder alle testdata in de juiste volgorde (foreign key dependencies)
-- Bewaard: tenants, profiles, user_roles, tenant_branding

DELETE FROM public.depth_measurements;
DELETE FROM public.pens;
DELETE FROM public.electrodes;
DELETE FROM public.project_measurement_sessions;
DELETE FROM public.project_attachments;
DELETE FROM public.projects;
DELETE FROM public.clients;
DELETE FROM public.technicians;
DELETE FROM public.equipment;