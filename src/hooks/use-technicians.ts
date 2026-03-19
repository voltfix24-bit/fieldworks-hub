import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Technician = Database['public']['Tables']['technicians']['Row'];
type TechnicianInsert = Database['public']['Tables']['technicians']['Insert'];
type TechnicianUpdate = Database['public']['Tables']['technicians']['Update'];

export function useTechnicians() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['technicians', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Technician[];
    },
    enabled: !!profile?.tenant_id,
  });
}

export function useTechnician(id: string | undefined) {
  return useQuery({
    queryKey: ['technicians', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Technician;
    },
    enabled: !!id,
  });
}

export function useCreateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tech: Omit<TechnicianInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('technicians').insert(tech).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technicians'] }),
  });
}

export function useUpdateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TechnicianUpdate & { id: string }) => {
      const { data, error } = await supabase.from('technicians').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technicians'] }),
  });
}

export function useDeleteTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('technicians').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technicians'] }),
  });
}
