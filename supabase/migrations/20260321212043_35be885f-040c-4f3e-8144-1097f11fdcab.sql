ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS target_value NUMERIC,
  ADD COLUMN IF NOT EXISTS housing_number TEXT,
  ADD COLUMN IF NOT EXISTS cable_material TEXT;