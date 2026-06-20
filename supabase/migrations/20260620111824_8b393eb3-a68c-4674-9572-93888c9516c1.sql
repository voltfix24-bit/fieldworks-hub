
CREATE TABLE public.function_call_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_function_call_log_lookup ON public.function_call_log (user_id, function_name, created_at DESC);

GRANT ALL ON public.function_call_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.function_call_log_id_seq TO service_role;

ALTER TABLE public.function_call_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON public.function_call_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _function_name TEXT,
  _max_per_minute INT DEFAULT 10
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.function_call_log
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND created_at > now() - interval '1 minute';

  IF recent_count >= _max_per_minute THEN
    RETURN false;
  END IF;

  INSERT INTO public.function_call_log (user_id, function_name)
  VALUES (_user_id, _function_name);

  DELETE FROM public.function_call_log
  WHERE created_at < now() - interval '1 hour';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INT) TO service_role;
