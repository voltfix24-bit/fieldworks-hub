
CREATE OR REPLACE FUNCTION public.complete_project(_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_tenant uuid;
  _proj record;
  _sess record;
  _electrodes int;
  _measurements int;
BEGIN
  -- Auth
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Niet geauthenticeerd');
  END IF;

  SELECT tenant_id INTO _user_tenant FROM public.profiles WHERE id = auth.uid();
  IF _user_tenant IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Geen tenant gevonden');
  END IF;

  SELECT * INTO _proj FROM public.projects WHERE id = _project_id;
  IF _proj.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Project niet gevonden');
  END IF;
  IF _proj.tenant_id <> _user_tenant THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Geen toegang tot dit project');
  END IF;

  -- Hard required fields
  IF _proj.client_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Klant ontbreekt');
  END IF;
  IF _proj.technician_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Monteur ontbreekt');
  END IF;
  IF _proj.equipment_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Meetapparatuur ontbreekt');
  END IF;

  SELECT * INTO _sess
  FROM public.project_measurement_sessions
  WHERE project_id = _project_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF _sess.id IS NULL OR _sess.measurement_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Meetdatum ontbreekt');
  END IF;

  SELECT count(*) INTO _electrodes FROM public.electrodes WHERE project_id = _project_id;
  IF _electrodes = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Minimaal één elektrode vereist');
  END IF;

  SELECT count(*) INTO _measurements
  FROM public.depth_measurements
  WHERE project_id = _project_id AND resistance_value IS NOT NULL AND resistance_value > 0;
  IF _measurements = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Minimaal één geldige meetwaarde vereist');
  END IF;

  UPDATE public.projects
  SET status = 'completed',
      completed_date = CURRENT_DATE,
      updated_at = now()
  WHERE id = _project_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_project(uuid) TO authenticated;
