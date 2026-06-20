import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportElectrode {
  id: string;
  electrode_code: string;
  label: string | null;
  is_coupled: boolean;
  ra_value: number | null;
  rv_value: number | null;
  target_value: number | null;
  target_met: boolean | null;
  notes: string | null;
  sort_order: number;
  pens: ReportPen[];
}

export interface ReportPen {
  id: string;
  pen_code: string;
  label: string | null;
  pen_depth_meters: number | null;
  display_photo_url: string | null;
  overview_photo_url: string | null;
  notes: string | null;
  sort_order: number;
  measurements: ReportMeasurement[];
}

export interface ReportMeasurement {
  id: string;
  depth_meters: number;
  resistance_value: number;
  sort_order: number;
}

interface ProjectDiagramRow {
  id: string;
  project_id: string;
  measurement_session_id: string | null;
  image_path: string | null;
  updated_at: string | null;
  created_at: string | null;
}

interface DiagramAttachment {
  id: string;
  project_id: string;
  measurement_session_id: string | null;
  attachment_type: 'sketch_file';
  file_url: string;
  file_name: string;
  caption: string;
  created_at: string;
  source: 'project_diagram';
}

function isDiagramAttachment(value: DiagramAttachment | null): value is DiagramAttachment {
  return value !== null;
}

async function getDiagramAttachments(projectId: string): Promise<DiagramAttachment[]> {
  const { data, error } = await (supabase as any)
    .from('project_diagrams')
    .select('id, project_id, measurement_session_id, image_path, updated_at, created_at')
    .eq('project_id', projectId)
    .not('image_path', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) {
    // Keep older reports working if a database has not received the diagram migration yet.
    console.warn('Project diagrams could not be loaded for report', error);
    return [];
  }

  const diagrams = (data || []) as ProjectDiagramRow[];
  const withUrls = await Promise.all(diagrams.map(async (diagram): Promise<DiagramAttachment | null> => {
    if (!diagram.image_path) return null;
    const { data: signed } = await supabase.storage
      .from('project-files')
      .createSignedUrl(diagram.image_path, 60 * 60);

    if (!signed?.signedUrl) return null;

    return {
      id: `diagram-${diagram.id}`,
      project_id: diagram.project_id,
      measurement_session_id: diagram.measurement_session_id,
      attachment_type: 'sketch_file',
      file_url: signed.signedUrl,
      file_name: 'Situatieschets.png',
      caption: 'Getekende situatieschets',
      created_at: diagram.updated_at || diagram.created_at || new Date().toISOString(),
      source: 'project_diagram',
    };
  }));

  return withUrls.filter(isDiagramAttachment);
}

export function useReportData(projectId: string | undefined) {
  return useQuery({
    queryKey: ['report-data', projectId],
    queryFn: async () => {
      // Fetch all data in parallel
      const [sessionRes, electrodesRes, pensRes, depthsRes, attachmentsRes, diagramAttachments] = await Promise.all([
        supabase.from('project_measurement_sessions').select('*').eq('project_id', projectId!).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('electrodes').select('*').eq('project_id', projectId!).order('sort_order'),
        supabase.from('pens').select('*').eq('project_id', projectId!).order('sort_order'),
        supabase.from('depth_measurements').select('*').eq('project_id', projectId!).order('sort_order'),
        supabase.from('project_attachments').select('*').eq('project_id', projectId!).order('created_at'),
        getDiagramAttachments(projectId!),
      ]);

      if (sessionRes.error) throw sessionRes.error;
      if (electrodesRes.error) throw electrodesRes.error;
      if (pensRes.error) throw pensRes.error;
      if (depthsRes.error) throw depthsRes.error;
      if (attachmentsRes.error) throw attachmentsRes.error;

      // Build nested structure
      const depths = depthsRes.data || [];
      const pens = (pensRes.data || []).map(pen => ({
        ...pen,
        measurements: depths.filter(d => d.pen_id === pen.id).sort((a, b) => a.sort_order - b.sort_order),
      }));

      const electrodes: ReportElectrode[] = (electrodesRes.data || []).map(el => ({
        ...el,
        pens: pens.filter(p => p.electrode_id === el.id).sort((a, b) => a.sort_order - b.sort_order),
      }));

      const totalMeasurements = depths.length;
      const totalPens = pens.length;
      const photosCount = pens.filter(p => p.display_photo_url || p.overview_photo_url).length;

      return {
        session: sessionRes.data,
        electrodes,
        attachments: [...(attachmentsRes.data || []), ...diagramAttachments],
        stats: {
          electrodeCount: electrodes.length,
          penCount: totalPens,
          measurementCount: totalMeasurements,
          photosCount,
        },
      };
    },
    enabled: !!projectId,
  });
}
