
CREATE OR REPLACE FUNCTION public.complete_project(_project_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_tenant uuid;
  _proj record;
BEGIN
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

  -- Geen harde validaties meer: rapport/afronden is altijd mogelijk.
  -- Ontbrekende velden worden in de UI als warnings getoond.

  UPDATE public.projects
  SET status = 'completed',
      completed_date = CURRENT_DATE,
      updated_at = now()
  WHERE id = _project_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;
