import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGeneratedReports(projectId?: string) {
  return useQuery({
    queryKey: ['generated-reports', projectId],
    queryFn: async () => {
      let query = supabase
        .from('project_attachments')
        .select('*, projects(project_name, project_number)')
        .eq('attachment_type', 'generated_rapport')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export async function downloadReport(fileUrl: string) {
  const { data, error } = await supabase.storage
    .from('generated-reports')
    .createSignedUrl(fileUrl, 3600);
  if (error) throw error;
  if (data?.signedUrl) {
    window.open(data.signedUrl, '_blank');
  }
}
