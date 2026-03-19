import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
type EquipmentUpdate = Database['public']['Tables']['equipment']['Update'];

export function useEquipmentList() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['equipment', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('device_name');
      if (error) throw error;
      return data as Equipment[];
    },
    enabled: !!profile?.tenant_id,
  });
}

export function useEquipment(id: string | undefined) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Equipment;
    },
    enabled: !!id,
  });
}

export function useDefaultEquipment() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['equipment', 'default', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Equipment | null;
    },
    enabled: !!profile?.tenant_id,
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eq: Omit<EquipmentInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('equipment').insert(eq).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EquipmentUpdate & { id: string }) => {
      const { data, error } = await supabase.from('equipment').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}
