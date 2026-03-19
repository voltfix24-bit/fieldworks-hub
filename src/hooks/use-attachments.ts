import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAttachments(projectId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_attachments')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: any) => {
      const { data, error } = await supabase.from('project_attachments').insert(attachment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['attachments', data.project_id] }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('project_attachments').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => qc.invalidateQueries({ queryKey: ['attachments', projectId] }),
  });
}

export async function uploadMeasurementPhoto(file: File, tenantId: string, projectId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${tenantId}/${projectId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('measurement-photos').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('measurement-photos').getPublicUrl(path);
  return data.publicUrl;
}
