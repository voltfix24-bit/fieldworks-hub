import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MSRDiagramCanvas } from '@/features/msr-diagram';

export default function ProjectDiagramPage() {
  const { id } = useParams<{ id: string }>();
  const [meta, setMeta] = useState<{
    tenantId: string;
    sessionId: string | null;
    housingNumber: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: project }, { data: session }] = await Promise.all([
        supabase.from('projects').select('tenant_id, housing_number').eq('id', id).maybeSingle(),
        supabase
          .from('project_measurement_sessions')
          .select('id')
          .eq('project_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!project) return;
      setMeta({
        tenantId: project.tenant_id as string,
        sessionId: (session?.id as string) || null,
        housingNumber: (project as any).housing_number || null,
      });
    })();
  }, [id]);

  if (!id || !meta) {
    return (
      <div className="fixed inset-0 z-[1000] bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <MSRDiagramCanvas
      projectId={id}
      tenantId={meta.tenantId}
      measurementSessionId={meta.sessionId}
      initialHousingNumber={meta.housingNumber}
      backTo={`/projects/${id}`}
    />
  );
}
