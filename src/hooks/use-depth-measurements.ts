import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDepthMeasurements(penId: string | undefined) {
  return useQuery({
    queryKey: ['depth-measurements', penId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depth_measurements')
        .select('*')
        .eq('pen_id', penId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!penId,
  });
}

export function useCreateDepthMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (measurement: any) => {
      const { data, error } = await supabase.from('depth_measurements').insert(measurement).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['depth-measurements', data.pen_id] }),
  });
}

export function useUpdateDepthMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('depth_measurements').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['depth-measurements', data.pen_id] }),
  });
}

export function useDeleteDepthMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, penId }: { id: string; penId: string }) => {
      const { error } = await supabase.from('depth_measurements').delete().eq('id', id);
      if (error) throw error;
      return penId;
    },
    onSuccess: (penId) => qc.invalidateQueries({ queryKey: ['depth-measurements', penId] }),
  });
}
