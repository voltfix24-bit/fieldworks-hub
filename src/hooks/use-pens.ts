import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Pen = Tables<'pens'>;
type PenInsert = TablesInsert<'pens'>;
type PenUpdate = TablesUpdate<'pens'> & { id: string };

export function usePens(electrodeId: string | undefined) {
  return useQuery({
    queryKey: ['pens', electrodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pens')
        .select('*')
        .eq('electrode_id', electrodeId!)
        .order('sort_order');
      if (error) throw error;
      return data as Pen[];
    },
    enabled: !!electrodeId,
  });
}

export function useCreatePen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pen: PenInsert) => {
      const { data, error } = await supabase.from('pens').insert(pen).select().single();
      if (error) throw error;
      return data as Pen;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['pens', data.electrode_id] }),
  });
}

export function useUpdatePen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: PenUpdate) => {
      const { data, error } = await supabase.from('pens').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Pen;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['pens', data.electrode_id] }),
  });
}

export function useDeletePen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, electrodeId }: { id: string; electrodeId: string }) => {
      const { error } = await supabase.from('pens').delete().eq('id', id);
      if (error) throw error;
      return electrodeId;
    },
    onSuccess: (electrodeId) => qc.invalidateQueries({ queryKey: ['pens', electrodeId] }),
  });
}
