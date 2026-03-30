-- Add missing anon DELETE policy for projects
CREATE POLICY "dev_anon_delete_projects"
ON public.projects
FOR DELETE
TO anon
USING (true);
