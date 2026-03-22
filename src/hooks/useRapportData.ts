import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/use-projects';
import { useTenant } from '@/contexts/TenantContext';
import type { RapportData, RapportElektrode } from '@/components/rapport/RapportTemplate';

export function useRapportData(projectId: string | undefined) {
  const { data: project } = useProject(projectId);
  const { tenant, branding } = useTenant();

  const buildRapportData = useCallback(async (
    handtekeningB64: string | null
  ): Promise<RapportData | null> => {
    if (!project || !projectId) return null;

    // Fetch session
    const { data: session } = await supabase
      .from('project_measurement_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) return null;

    // Fetch electrodes, all pens, and related data in parallel
    const [electrodesRes, allPensRes, clientRes, techRes, equipRes] = await Promise.all([
      supabase.from('electrodes').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('pens').select('*').eq('project_id', projectId).order('sort_order'),
      session.client_id
        ? supabase.from('clients').select('*').eq('id', session.client_id).single()
        : Promise.resolve({ data: null }),
      session.technician_id
        ? supabase.from('technicians').select('*').eq('id', session.technician_id).single()
        : Promise.resolve({ data: null }),
      session.equipment_id
        ? supabase.from('equipment').select('*').eq('id', session.equipment_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const electrodes = electrodesRes.data || [];
    const allPens = allPensRes.data || [];
    const klant = clientRes.data as any;
    const monteur = techRes.data as any;
    const apparaat = equipRes.data as any;

    // Fetch all depth measurements for this project
    const { data: allDepths } = await supabase
      .from('depth_measurements')
      .select('*')
      .eq('project_id', projectId)
      .order('depth_meters');

    const depths = allDepths || [];

    // Build elektrodes array
    const elektrodesData: RapportElektrode[] = electrodes.map((el: any, idx: number) => {
      const elPens = allPens.filter((p: any) => p.electrode_id === el.id);
      const isRv = elPens.length >= 2;
      const eindwaarde = isRv ? el.rv_value : el.ra_value;
      const rvOk = eindwaarde !== null &&
        el.target_value !== null &&
        Number(eindwaarde) <= Number(el.target_value);

      const eerstePen = elPens[0];

      const pennen = elPens.map((pen: any) => {
        const penDepths = depths.filter((d: any) => d.pen_id === pen.id);
        return {
          code: pen.pen_code || `Pen ${pen.sort_order + 1}`,
          metingen: penDepths.map((d: any) => ({
            diepte: Number(d.depth_meters),
            waarde: Number(d.resistance_value) > 0 ? Number(d.resistance_value) : null,
          })),
        };
      });

      return {
        nummer: idx + 1,
        code: el.electrode_code || `Elektrode ${idx + 1}`,
        eindtype: isRv ? 'RV' as const : 'RA' as const,
        eindwaarde: eindwaarde !== null ? Number(eindwaarde) : null,
        target_value: el.target_value !== null ? Number(el.target_value) : null,
        rv_ok: rvOk,
        notes: el.notes || null,
        pennen,
        foto_display_url: eerstePen?.display_photo_url || null,
        foto_overzicht_url: eerstePen?.overview_photo_url || null,
      };
    });

    return {
      project_naam: project.project_name,
      project_nummer: project.project_number || '',
      project_adres: [project.address_line_1, project.city].filter(Boolean).join(', '),
      meetdatum: session.measurement_date || new Date().toISOString().split('T')[0],
      logo_url: (branding as any)?.logo_url || null,
      merk_kleur: (branding as any)?.primary_color || '#F4896B',
      bedrijf_naam: (tenant as any)?.company_name || '',
      bedrijf_adres: (branding as any)?.footer_address
        ? [(branding as any).footer_address, (branding as any).footer_city].filter(Boolean).join(', ')
        : '',
      bedrijf_telefoon: (branding as any)?.footer_phone || '',
      bedrijf_email: (branding as any)?.footer_email || '',
      bedrijf_website: (branding as any)?.footer_website || '',
      klant_naam: klant?.company_name || '',
      klant_contact: klant?.contact_name || '',
      monteur_naam: monteur?.full_name || '',
      apparaat_naam: apparaat?.device_name || '',
      apparaat_merk: apparaat?.brand || '',
      apparaat_model: apparaat?.model || '',
      apparaat_serienummer: apparaat?.serial_number || '',
      kalibratie_datum: apparaat?.calibration_date || '',
      volgende_kalibratie: apparaat?.next_calibration_date || '',
      elektrodes: elektrodesData,
      handtekening_b64: handtekeningB64,
      monteur_naam_ondertekening: monteur?.full_name || '',
    };
  }, [project, projectId, tenant, branding]);

  return { buildRapportData };
}
