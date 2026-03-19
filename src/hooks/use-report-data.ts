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

export function useReportData(projectId: string | undefined) {
  return useQuery({
    queryKey: ['report-data', projectId],
    queryFn: async () => {
      // Fetch all data in parallel
      const [sessionRes, electrodesRes, pensRes, depthsRes, attachmentsRes] = await Promise.all([
        supabase.from('project_measurement_sessions').select('*').eq('project_id', projectId!).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('electrodes').select('*').eq('project_id', projectId!).order('sort_order'),
        supabase.from('pens').select('*').eq('project_id', projectId!).order('sort_order'),
        supabase.from('depth_measurements').select('*').eq('project_id', projectId!).order('sort_order'),
        supabase.from('project_attachments').select('*').eq('project_id', projectId!).order('created_at'),
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
        attachments: attachmentsRes.data || [],
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
