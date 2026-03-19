import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type ProjectWithRelations = Project & {
  clients: { company_name: string; contact_name: string | null } | null;
  technicians: { full_name: string } | null;
  equipment: { device_name: string; brand: string | null; model: string | null } | null;
};

export function useProjects() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['projects', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, clients(company_name, contact_name), technicians(full_name), equipment(device_name, brand, model)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectWithRelations[];
    },
    enabled: !!profile?.tenant_id,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, clients(company_name, contact_name, email, phone, address_line_1, city, country), technicians(full_name, email, phone, employee_code), equipment(device_name, brand, model, serial_number, calibration_date, next_calibration_date)`)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
