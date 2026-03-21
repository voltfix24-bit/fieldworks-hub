import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClientProjects(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId!)
        .order('planned_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}
