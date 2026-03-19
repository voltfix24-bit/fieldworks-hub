import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMeasurementSession(projectId: string | undefined) {
  return useQuery({
    queryKey: ['measurement-session', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_measurement_sessions')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateMeasurementSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: any) => {
      const { data, error } = await supabase
        .from('project_measurement_sessions')
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['measurement-session', data.project_id] });
    },
  });
}

export function useUpdateMeasurementSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('project_measurement_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['measurement-session', data.project_id] });
    },
  });
}
