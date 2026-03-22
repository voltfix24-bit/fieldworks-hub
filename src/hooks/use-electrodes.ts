import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Electrode = Tables<'electrodes'>;
type ElectrodeInsert = TablesInsert<'electrodes'>;
type ElectrodeUpdate = TablesUpdate<'electrodes'> & { id: string };

export function useElectrodes(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['electrodes', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('electrodes')
        .select('*')
        .eq('measurement_session_id', sessionId!)
        .order('sort_order');
      if (error) throw error;
      return data as Electrode[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateElectrode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (electrode: ElectrodeInsert) => {
      const { data, error } = await supabase.from('electrodes').insert(electrode).select().single();
      if (error) throw error;
      return data as Electrode;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['electrodes', data.measurement_session_id] }),
  });
}

export function useUpdateElectrode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ElectrodeUpdate) => {
      const { data, error } = await supabase.from('electrodes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Electrode;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['electrodes', data.measurement_session_id] });
      qc.invalidateQueries({ queryKey: ['electrodes'] });
    },
  });
}

export function useDeleteElectrode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase.from('electrodes').delete().eq('id', id);
      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId) => qc.invalidateQueries({ queryKey: ['electrodes', sessionId] }),
  });
}
