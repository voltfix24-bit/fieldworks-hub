import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, WifiOff, AlertTriangle, Check, X as XIcon, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode, useDeleteElectrode } from '@/hooks/use-electrodes';
import { usePens, useCreatePen, useUpdatePen, useDeletePen } from '@/hooks/use-pens';
import { useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { useAttachments, uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { GroundingIcon, GroundingLoader } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';

import { WizardStepIndicator } from '@/components/measurement/wizard/WizardStepIndicator';
import { StickyActionBar } from '@/components/measurement/wizard/StickyActionBar';
import { MeasurementStep } from '@/components/measurement/wizard/steps/MeasurementStep';
import { PhotoStep } from '@/components/measurement/wizard/steps/PhotoStep';
import { NextActionStep } from '@/components/measurement/wizard/steps/NextActionStep';
import { SketchStep } from '@/components/measurement/wizard/steps/SketchStep';

const PREDEFINED_DEPTHS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

const WIZARD_STEPS = [
  { label: 'Metingen', key: 'measurements' },
  { label: "Foto's", key: 'photos' },
  { label: 'Volgende', key: 'next' },
];

export default function MeasurementWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const tenantId = profile?.tenant_id || '';
  const { isOnline } = useOnlineStatus();

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: session, isLoading: sessionLoading } = useMeasurementSession(id);
  const createSession = useCreateMeasurementSession();
  const updateSession = useUpdateMeasurementSession();

  const { data: electrodes = [] } = useElectrodes(session?.id);
  const createElectrode = useCreateElectrode();
  const updateElectrode = useUpdateElectrode();
  const deleteElectrode = useDeleteElectrode();

  const [activeElectrodeId, setActiveElectrodeId] = useState<string | null>(null);
  const activeElectrode = electrodes.find((e: any) => e.id === activeElectrodeId);
  const { data: pens = [] } = usePens(activeElectrodeId || undefined);

  const [activePenId, setActivePenId] = useState<string | null>(null);
  const activePen = pens.find((p: any) => p.id === activePenId);

  // Warning count from MeasurementStep (reported via callback)
  const [warningCount, setWarningCount] = useState(0);
  const [rvMissing, setRvMissing] = useState(false);

  const createPen = useCreatePen();
  const updatePen = useUpdatePen();
  const deletePen = useDeletePen();

  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

  const [step, setStep] = useState(0);
  const [showSketch, setShowSketch] = useState(false);

  const [autoInitDone, setAutoInitDone] = useState(false);
  const [autoInitError, setAutoInitError] = useState(false);
  const [progressionWarningDismissed, setProgressionWarningDismissed] = useState(false);
  const [handtekeningB64, setHandtekeningB64] = useState<string | null>(null);
  const [elektrodesAanmaken, setElektrodesAanmaken] = useState(false);
  const [elektrodeTeVerwijderen, setElektrodeTeVerwijderen] = useState<any>(null);
  const depthsInitRef = useRef<Set<string>>(new Set());

  // DEEL 1 — Battery warning
  const [batterijLaag, setBatterijLaag] = useState(false);

  // DEEL 3 — Swipe between steps
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const SWIPE_DREMPEL = 60;

  // DEEL 4 — High contrast mode
  const [hoogContrast, setHoogContrast] = useState(false);

  // Photo upload state per electrode
  const [uploadingPerElektrode, setUploadingPerElektrode] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  // DEEL 1 — Data loss prevention: blur active input on visibility change / beforeunload
  useEffect(() => {
    const blurActief = () => {
      const actief = document.activeElement as HTMLElement;
      if (actief && (actief.tagName === 'INPUT' || actief.tagName === 'TEXTAREA')) {
        actief.blur();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') blurActief();
    };
    const handleUnload = () => blurActief();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Battery check
  useEffect(() => {
    if (!('getBattery' in navigator)) return;
    let battery: any = null;
    const checkBatterij = () => {
      if (!battery) return;
      const pct = Math.round(battery.level * 100);
      const laden = battery.charging;
      setBatterijLaag(pct <= 20 && !laden);
      if (pct <= 20 && !laden) {
        toast({
          title: `Batterij ${pct}%`,
          description: 'Laad je telefoon op — niet opgeslagen data kan verloren gaan bij uitschakelen.',
          duration: 8000,
        });
      }
    };
    (navigator as any).getBattery().then((bat: any) => {
      battery = bat;
      checkBatterij();
      bat.addEventListener('levelchange', checkBatterij);
      bat.addEventListener('chargingchange', checkBatterij);
    }).catch(() => {});
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', checkBatterij);
        battery.removeEventListener('chargingchange', checkBatterij);
      }
    };
  }, []);

  // Scroll position per step
  const scrollPosities = useRef<Record<number, number>>({});
  const handleStapWissel = (nieuweStap: number) => {
    scrollPosities.current[step] = window.scrollY;
    setStep(nieuweStap);
  };
  useEffect(() => {
    const opgeslagen = scrollPosities.current[step];
    if (opgeslagen !== undefined) {
      setTimeout(() => window.scrollTo({ top: opgeslagen, behavior: 'instant' as ScrollBehavior }), 50);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [step]);

  // Exit confirmation
  const [toonAfsluitBevestiging, setToonAfsluitBevestiging] = useState(false);

  // Track active electrode
  useEffect(() => {
    if (electrodes.length > 0 && !electrodes.find((e: any) => e.id === activeElectrodeId)) {
      setActiveElectrodeId(electrodes[electrodes.length - 1].id);
    }
  }, [electrodes]);

  // Track active pen
  useEffect(() => {
    if (pens.length > 0 && !pens.find((p: any) => p.id === activePenId)) {
      setActivePenId(pens[pens.length - 1].id);
    }
  }, [pens]);

  // Auto-initialize: create session + electrode 1 + pen 1 + depths if nothing exists
  useEffect(() => {
    if (autoInitDone || !project || sessionLoading || projectLoading) return;
    if (session && electrodes.length > 0) {
      setAutoInitDone(true);
      return;
    }
    if (!session && !createSession.isPending) {
      setAutoInitDone(true);
      (async () => {
        try {
          const payload = {
            measurement_date: project.planned_date || new Date().toISOString().split('T')[0],
            client_id: project.client_id || null,
            technician_id: project.technician_id || null,
            equipment_id: project.equipment_id || null,
            tenant_id: tenantId,
            project_id: id,
          };
          const sessionData = await createSession.mutateAsync(payload);
          const newElectrode = await createElectrode.mutateAsync({
            tenant_id: tenantId, project_id: id,
            measurement_session_id: sessionData.id,
            electrode_code: 'Elektrode 1', sort_order: 0,
          });
          setActiveElectrodeId(newElectrode.id);
          const newPen = await createPen.mutateAsync({
            tenant_id: tenantId, project_id: id!,
            measurement_session_id: sessionData.id,
            electrode_id: newElectrode.id,
            pen_code: 'Pen 1', sort_order: 0,
          });
          setActivePenId(newPen.id);
          initializeDepthRows(newPen.id, newPen);
        } catch (e) {
          console.error('Auto-init failed', e);
          setAutoInitError(true);
          setAutoInitDone(false);
        }
      })();
    }
  }, [project, session, sessionLoading, projectLoading, autoInitDone]);

  const initializeDepthRows = useCallback((penId: string, pen: any) => {
    if (depthsInitRef.current.has(penId)) return;
    depthsInitRef.current.add(penId);
    supabase
      .from('depth_measurements')
      .select('id')
      .eq('pen_id', penId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) return;
        PREDEFINED_DEPTHS.forEach((d, i) => {
          createMeasurement.mutate({
            tenant_id: tenantId, project_id: pen.project_id,
            measurement_session_id: pen.measurement_session_id,
            electrode_id: pen.electrode_id,
            pen_id: penId, depth_meters: d, resistance_value: 0, sort_order: i,
          });
        });
      });
  }, [tenantId, createMeasurement]);

  const handleAddNewPen = async () => {
    if (!activeElectrode) return;
    const newPen = await createPen.mutateAsync({
      tenant_id: tenantId, project_id: activeElectrode.project_id,
      measurement_session_id: activeElectrode.measurement_session_id,
      electrode_id: activeElectrode.id,
      pen_code: `Pen ${pens.length + 1}`, sort_order: pens.length,
    });
    setActivePenId(newPen.id);
    initializeDepthRows(newPen.id, newPen);

    // Als dit de tweede pen is → elektrode wordt RV (gekoppeld)
    if (pens.length === 1) {
      await updateElectrode.mutateAsync({
        id: activeElectrode.id,
        is_coupled: true,
        ra_value: null,
      });
    }

    setTimeout(() => {
      const el = document.getElementById(`pen-section-${newPen.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleDeletePen = async (penId: string) => {
    await deletePen.mutateAsync({ id: penId, electrodeId: activeElectrodeId! });
    if (activePenId === penId) {
      const overige = pens.filter((p: any) => p.id !== penId);
      if (overige.length > 0) setActivePenId(overige[0].id);
    }
    // Als er nog maar 1 pen over is → terug naar RA modus
    const overigePennen = pens.filter((p: any) => p.id !== penId);
    if (overigePennen.length === 1 && activeElectrodeId) {
      await updateElectrode.mutateAsync({
        id: activeElectrodeId,
        is_coupled: false,
        rv_value: null,
      });
    }
    toast({ description: 'Pen verwijderd' });
  };

  const handlePenToevoegenMetCheck = () => {
    handleAddNewPen();
  };

  const handleElectrodeWissel = (electrodeId: string) => {
    setActiveElectrodeId(electrodeId);
    setWarningCount(0);
    setProgressionWarningDismissed(false);
    setRvMissing(false);
    setStep(0);
  };

  const handleAddNewElectrode = async () => {
    if (!session || elektrodesAanmaken) return;
    setElektrodesAanmaken(true);
    try {
      const nieuweCode = `Elektrode ${electrodes.length + 1}`;
      const newElectrode = await createElectrode.mutateAsync({
        tenant_id: tenantId,
        project_id: id,
        measurement_session_id: session.id,
        electrode_code: nieuweCode,
        sort_order: electrodes.length,
      });
      handleElectrodeWissel(newElectrode.id);
      const newPen = await createPen.mutateAsync({
        tenant_id: tenantId, project_id: id!,
        measurement_session_id: session.id,
        electrode_id: newElectrode.id,
        pen_code: 'Pen 1', sort_order: 0,
      });
      setActivePenId(newPen.id);
      initializeDepthRows(newPen.id, newPen);
      setStep(0);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Aanmaken mislukt',
        description: 'Probeer opnieuw.',
      });
    } finally {
      setElektrodesAanmaken(false);
    }
  };

  // Photo upload per electrode
  const handlePhotoUploadVoorElektrode = async (
    electrodeId: string,
    type: 'display_photo_url' | 'overview_photo_url',
    file: File
  ) => {
    const { data: elektrodePens } = await supabase
      .from('pens')
      .select('*')
      .eq('electrode_id', electrodeId)
      .order('sort_order')
      .limit(1);

    const doelPen = elektrodePens?.[0];
    if (!doelPen) return;

    setUploadingPerElektrode(prev => ({ ...prev, [electrodeId]: true }));

    let pogingen = 0;
    const maxPogingen = 3;

    while (pogingen < maxPogingen) {
      try {
        const url = await uploadMeasurementPhoto(file, tenantId, doelPen.project_id);
        await updatePen.mutateAsync({ id: doelPen.id, [type]: url });
        qc.invalidateQueries({ queryKey: ['all-pens', session?.id] });
        toast({ description: 'Foto opgeslagen ✓', duration: 1500 });
        break;
      } catch (err: any) {
        pogingen++;
        if (pogingen === maxPogingen) {
          toast({
            variant: 'destructive',
            title: 'Upload mislukt',
            description: err?.message || 'Controleer je verbinding.',
          });
        } else {
          await new Promise(r => setTimeout(r, 1000 * pogingen));
        }
      }
    }

    setUploadingPerElektrode(prev => ({ ...prev, [electrodeId]: false }));
  };

  const handlePhotoRemoveVoorElektrode = async (
    electrodeId: string,
    type: 'display_photo_url' | 'overview_photo_url'
  ) => {
    const { data: elektrodePens } = await supabase
      .from('pens')
      .select('id')
      .eq('electrode_id', electrodeId)
      .order('sort_order')
      .limit(1);

    const doelPen = elektrodePens?.[0];
    if (!doelPen) return;

    await updatePen.mutateAsync({ id: doelPen.id, [type]: null });
    qc.invalidateQueries({ queryKey: ['all-pens', session?.id] });
  };

  // Fetch all pens for all electrodes (for photo step)
  const { data: allePens = [] } = useQuery({
    queryKey: ['all-pens', session?.id],
    queryFn: async () => {
      if (electrodes.length === 0) return [];
      const { data, error } = await supabase
        .from('pens')
        .select('*')
        .in('electrode_id', electrodes.map((e: any) => e.id))
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: electrodes.length > 0 && !!session,
  });

  const elektrodesMetFotos = electrodes.map((e: any) => {
    const eerstePen = allePens.find((p: any) => p.electrode_id === e.id);
    return {
      id: e.id,
      code: e.electrode_code,
      displayPhotoUrl: eerstePen?.display_photo_url ?? null,
      overviewPhotoUrl: eerstePen?.overview_photo_url ?? null,
      uploading: uploadingPerElektrode[e.id] ?? false,
    };
  });


  // Summary data for NextActionStep
  const elektrodesVoorSamenvatting = electrodes.map((e: any) => {
    const eerstePen = allePens.find((p: any) => p.electrode_id === e.id);
    const isRv = (allePens.filter((p: any) => p.electrode_id === e.id).length >= 2);
    return {
      id: e.id,
      code: e.electrode_code,
      eindtype: (isRv ? 'RV' : 'RA') as 'RA' | 'RV',
      eindwaarde: isRv ? e.rv_value : e.ra_value,
      targetValue: e.target_value,
      heeftDisplayFoto: !!eerstePen?.display_photo_url,
      heeftOverzichtFoto: !!eerstePen?.overview_photo_url,
    };
  });

  // Swipe handlers for mobile step navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = swipeStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(swipeStartY.current - e.changedTouches[0].clientY);
    if (dy > 40) return;
    if (Math.abs(dx) < SWIPE_DREMPEL) return;
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    if (dx > 0 && step < 2) {
      if (step === 0 && warningCount > 0 && !progressionWarningDismissed) return;
      handleStapWissel(step + 1);
      if (navigator.vibrate) navigator.vibrate(6);
    } else if (dx < 0 && step > 0) {
      handleStapWissel(step - 1);
      if (navigator.vibrate) navigator.vibrate(6);
    }
  };

  const recalcRa = useCallback((electrodeId: string, updatedMeasurements: any[]) => {
    // Bij 2+ pennen is RV leidend — recalcRa NIET uitvoeren
    const aantalPennen = pens.filter((p: any) => p.electrode_id === electrodeId).length;
    if (aantalPennen >= 2) return;

    // Bij 1 pen: RA automatisch berekenen
    const validValues = updatedMeasurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
    const lowestResistance = validValues.length > 0 ? Math.min(...validValues) : null;
    updateElectrode.mutate({ id: electrodeId, ra_value: lowestResistance }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['electrodes', session?.id] });
      }
    });
  }, [updateElectrode, qc, session?.id, pens]);

  if (projectLoading || sessionLoading) return (
    <div className="flex justify-center py-20"><GroundingLoader /></div>
  );
  if (autoInitError) return (
    <div className="flex justify-center py-20">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-6 text-center max-w-sm mx-auto">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 text-destructive">
          <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[14px] font-semibold text-foreground mb-1">Initialisatie mislukt</p>
        <p className="text-[12px] text-muted-foreground mb-4">Controleer je verbinding en probeer opnieuw.</p>
        <button
          onClick={() => { setAutoInitError(false); setAutoInitDone(false); }}
          className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white bg-[hsl(var(--tenant-primary,var(--primary)))] active:scale-[0.97] transition-transform"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-[13px] text-muted-foreground">Project niet gevonden</p>
    </div>
  );

  // Exit confirmation handler
  const handleBack = () => {
    const heeftInvoer = electrodes.length > 0;
    if (heeftInvoer) {
      setToonAfsluitBevestiging(true);
    } else {
      navigate(`/projects/${id}`);
    }
  };

  const displayStep = showSketch ? -1 : step;

  // ═══════════════════════════════════════════════
  // Electrode switcher bar (shared between mobile and desktop)
  // ═══════════════════════════════════════════════
  const renderElectrodeSwitcher = () => (
    <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-b border-border/10">
      {electrodes.map((e: any) => {
        const klaar = e.ra_value != null || e.rv_value != null;
        const voldoet = klaar && ((e.ra_value ?? e.rv_value) <= (e.target_value ?? 999));
        const actief = e.id === activeElectrodeId;
        return (
          <button
            key={e.id}
            onMouseDown={(ev) => {
              ev.preventDefault();
              (document.activeElement as HTMLElement)?.blur();
              handleElectrodeWissel(e.id);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.96] min-h-[34px]',
              actief
                ? 'bg-[hsl(var(--tenant-primary))] text-white shadow-sm'
                : klaar && voldoet
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                  : klaar && !voldoet
                    ? 'bg-destructive/8 text-destructive border border-destructive/20'
                    : 'bg-card text-foreground border border-border/40'
            )}
          >
            {klaar && voldoet && !actief && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {e.electrode_code}
          </button>
        );
      })}

      {/* + knop voor nieuwe elektrode */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement)?.blur();
          handleAddNewElectrode();
        }}
        disabled={elektrodesAanmaken}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-xl shrink-0 border border-dashed border-[hsl(var(--tenant-primary)/0.3)] text-[hsl(var(--tenant-primary))] active:scale-[0.93] transition-all',
          elektrodesAanmaken && 'opacity-40'
        )}
      >
        {elektrodesAanmaken ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );

  // ═══════════════════════════════════════════════
  // MOBILE: fullscreen work mode
  // ═══════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className={cn("fixed inset-0 z-50 flex flex-col animate-fade-in overflow-x-hidden max-w-full", hoogContrast ? 'hoog-contrast bg-white' : 'bg-background')}>
        {/* ─── iOS sticky top nav ─── */}
        <div className="ios-wizard-topnav shrink-0">
          <div className="ios-wizard-nav-row">
            <button
              onClick={handleBack}
              className="ios-wizard-nav-back"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{project.project_name}</span>
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* DEEL 4 — High contrast toggle */}
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setHoogContrast(prev => !prev);
                  if (navigator.vibrate) navigator.vibrate(8);
                }}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90',
                  hoogContrast
                    ? 'bg-foreground text-background'
                    : 'bg-muted/30 text-muted-foreground/50'
                )}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {activeElectrode && !showSketch && (
                <span className="ios-wizard-nav-badge max-w-[160px] truncate bg-[hsl(var(--tenant-primary)/0.12)] text-[hsl(var(--tenant-primary))] font-bold px-2.5 py-1 rounded-lg text-[11px]">
                  {activeElectrode.electrode_code}
                  {activePen && step === 0 ? ` · ${activePen.pen_code}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Step tabs */}
          {!showSketch && (
            <div className="ios-wizard-step-tabs">
              {WIZARD_STEPS.map((s, i) => (
                <button
                  key={s.key}
                  className={cn(
                    'ios-wizard-step-tab',
                    i === step && 'active',
                    i < step && 'done',
                  )}
                  onClick={() => {
                    if (i <= step) { setShowSketch(false); handleStapWissel(i); setProgressionWarningDismissed(false); }
                  }}
                >
                  {i < step && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="hsl(var(--status-completed))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Electrode switcher */}
        {!showSketch && electrodes.length > 0 && renderElectrodeSwitcher()}

        {/* DEEL 1 — Battery warning banner */}
        {batterijLaag && (
          <div className="flex items-center gap-2 px-4 py-2 shrink-0 bg-amber-500/10 border-b border-amber-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="18" height="11" rx="2" stroke="hsl(40 90% 50%)" strokeWidth="2"/>
              <path d="M20 11V13" stroke="hsl(40 90% 50%)" strokeWidth="2" strokeLinecap="round"/>
              <rect x="4" y="9" width="7" height="7" rx="1" fill="hsl(40 90% 50%)"/>
            </svg>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex-1">
              Batterij laag — sla regelmatig op
            </span>
          </div>
        )}

        {/* ─── Offline banner ─── */}
        {!isOnline && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-400/20">
            <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">Geen verbinding — metingen worden lokaal opgeslagen en later gesynchroniseerd</p>
          </div>
        )}

        {/* ─── Scrollable content with swipe ─── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-2 overflow-x-hidden measurement-scroll-container"
          style={{ maxWidth: '100vw' }}
          key={showSketch ? 'sketch' : step}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="wizard-step-enter">

            {step === 0 && !showSketch && activeElectrode && (
              <MeasurementStep
                electrode={activeElectrode}
                pens={pens}
                tenantId={tenantId}
                onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
                onAddPen={handlePenToevoegenMetCheck}
                onDeletePen={handleDeletePen}
                recalcRa={recalcRa}
                depthsInitRef={depthsInitRef}
                initializeDepthRows={initializeDepthRows}
                onWarningCountChange={setWarningCount}
                onRvMissingChange={setRvMissing}
                compact
              />
            )}

            {step === 1 && !showSketch && (
              <PhotoStep
                elektrodes={elektrodesMetFotos}
                onUpload={handlePhotoUploadVoorElektrode}
                onRemove={handlePhotoRemoveVoorElektrode}
                compact
              />
            )}

            {step === 2 && !showSketch && (
              <NextActionStep
                onGoToSketch={() => setShowSketch(true)}
                onSave={() => navigate(`/projects/${id}`)}
                onHandtekeningChange={setHandtekeningB64}
                elektrodes={elektrodesVoorSamenvatting}
                compact
              />
            )}

            {showSketch && (
              <SketchStep projectId={id!} tenantId={tenantId} sessionId={session?.id} />
            )}
          </div>
        </div>

        {/* ─── iOS bottom bar ─── */}
        {step < 2 && !showSketch && (
          <div className="shrink-0">
            {warningCount > 0 && step === 0 && !progressionWarningDismissed && (
              <div className="ios-wizard-warning">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L15 14H1L8 1Z" stroke="hsl(40, 90%, 50%)" strokeWidth="1.5" fill="hsl(40, 90%, 50%, 0.08)"/><path d="M8 6V9M8 11.5V11" stroke="hsl(40, 90%, 50%)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span className="ios-wizard-warning-text">
                  {warningCount} {warningCount === 1 ? 'meetwaarde wijkt' : 'meetwaarden wijken'} af
                </span>
                <button className="ios-wizard-warning-btn" onClick={() => { setProgressionWarningDismissed(true); handleStapWissel(step + 1); }}>
                  Doorgaan
                </button>
              </div>
            )}
            <div className="ios-wizard-bottom-bar">
              {step > 0 ? (
                <button className="ios-wizard-btn-back" onMouseDown={(e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement)?.blur();
                  setTimeout(() => { handleStapWissel(Math.max(0, step - 1)); setProgressionWarningDismissed(false); }, 50);
                }}>
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Vorige
                </button>
              ) : <div />}
              <button
                className="ios-wizard-btn-next"
                onMouseDown={(e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement)?.blur();
                  if (step === 0 && warningCount > 0 && !progressionWarningDismissed) return;
                  if (navigator.vibrate) navigator.vibrate([6, 30, 6]);
                  setTimeout(() => { setProgressionWarningDismissed(false); handleStapWissel(step + 1); }, 50);
                }}
              >
                Volgende
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1L7 7L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}

        {showSketch && (
          <div className="shrink-0">
            <div className="ios-wizard-bottom-bar">
              <button className="ios-wizard-btn-back" onClick={() => setShowSketch(false)}>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Vorige
              </button>
              <button className="ios-wizard-btn-next" onClick={() => { setShowSketch(false); navigate(`/projects/${id}`); }}>
                Opslaan
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Exit confirmation dialog */}
        {toonAfsluitBevestiging && (
          <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4">
            <div className="w-full max-w-sm bg-background rounded-3xl p-5 shadow-xl">
              <h3 className="text-[17px] font-bold text-foreground mb-1">Meting verlaten?</h3>
              <p className="text-[14px] text-muted-foreground/60 mb-5">
                Alle ingevoerde metingen zijn automatisch opgeslagen. Je kunt later verdergaan.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setToonAfsluitBevestiging(false); navigate(`/projects/${id}`); }}
                  className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tenant-primary))] text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
                >
                  Ja, verlaten
                </button>
                <button
                  onClick={() => setToonAfsluitBevestiging(false)}
                  className="w-full py-3.5 rounded-2xl bg-muted/30 text-muted-foreground font-semibold text-[15px] active:scale-[0.98] transition-all"
                >
                  Verder meten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // DESKTOP layout
  // ═══════════════════════════════════════════════
  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-1 sm:px-4">
      <div className="flex items-center gap-2 mb-4 pt-1">
        <button
          onClick={handleBack}
          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate flex items-center gap-1.5 tracking-tight text-[15px]">
            <GroundingIcon size={13} className="text-primary shrink-0" />
            {project.project_name}
          </h1>
          <span className="text-[11px] text-muted-foreground font-mono tracking-wide">{project.project_number}</span>
        </div>
      </div>

      {/* ─── Offline banner (desktop) ─── */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-400/20">
          <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-[12px] text-amber-700 font-medium">Geen verbinding — metingen worden lokaal opgeslagen en later gesynchroniseerd</p>
        </div>
      )}

      <div className="mb-5 -mx-1 sm:mx-0">
        <WizardStepIndicator
          steps={WIZARD_STEPS}
          currentStep={step}
          onStepClick={(i) => { setShowSketch(false); handleStapWissel(i); }}
        />
      </div>

      {/* Electrode switcher (desktop) */}
      {!showSketch && electrodes.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
          {electrodes.map((e: any) => {
            const klaar = e.ra_value != null || e.rv_value != null;
            const voldoet = klaar && ((e.ra_value ?? e.rv_value) <= (e.target_value ?? 999));
            const actief = e.id === activeElectrodeId;
            return (
              <button
                key={e.id}
                onClick={() => handleElectrodeWissel(e.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all',
                  actief
                    ? 'bg-[hsl(var(--tenant-primary))] text-white shadow-sm'
                    : klaar && voldoet
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                      : klaar && !voldoet
                        ? 'bg-destructive/8 text-destructive border border-destructive/20'
                        : 'bg-muted/30 text-muted-foreground/60'
                )}
              >
                {klaar && voldoet && !actief && <Check className="h-3 w-3" />}
                {klaar && !voldoet && !actief && <XIcon className="h-3 w-3" />}
                {e.electrode_code}
              </button>
            );
          })}
          <button
            onClick={handleAddNewElectrode}
            disabled={elektrodesAanmaken}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-xl shrink-0 border border-dashed border-[hsl(var(--tenant-primary)/0.3)] text-[hsl(var(--tenant-primary))] active:scale-[0.93] transition-all',
              elektrodesAanmaken && 'opacity-40'
            )}
          >
            {elektrodesAanmaken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}

      <div className="min-h-[50vh] wizard-step-enter" key={showSketch ? 'sketch' : step}>
        {step === 0 && !showSketch && activeElectrode && (
          <MeasurementStep
            electrode={activeElectrode}
            pens={pens}
            tenantId={tenantId}
            onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
            onAddPen={handlePenToevoegenMetCheck}
            onDeletePen={handleDeletePen}
            recalcRa={recalcRa}
            depthsInitRef={depthsInitRef}
            initializeDepthRows={initializeDepthRows}
            onRvMissingChange={setRvMissing}
          />
        )}

        {step === 1 && !showSketch && (
          <PhotoStep
            elektrodes={elektrodesMetFotos}
            onUpload={handlePhotoUploadVoorElektrode}
            onRemove={handlePhotoRemoveVoorElektrode}
          />
        )}

        {step === 2 && !showSketch && (
          <NextActionStep
            onAddElectrode={handleAddNewElectrode}
            onGoToSketch={() => setShowSketch(true)}
            onSave={() => navigate(`/projects/${id}`)}
            nextElectrodeNumber={electrodes.length + 1}
            onHandtekeningChange={setHandtekeningB64}
            elektrodes={elektrodesVoorSamenvatting}
          />
        )}

        {showSketch && (
          <SketchStep projectId={id!} tenantId={tenantId} sessionId={session?.id} />
        )}
      </div>

      {step < 2 && !showSketch && (
        <StickyActionBar
          showPrev={step > 0}
          onPrev={() => handleStapWissel(step - 1)}
          onNext={() => handleStapWissel(step + 1)}
          nextLabel="Volgende"
          nextDisabled={false}
        />
      )}

      {showSketch && (
        <StickyActionBar
          showPrev
          onPrev={() => setShowSketch(false)}
          onNext={() => { setShowSketch(false); navigate(`/projects/${id}`); }}
          nextLabel="Opslaan"
        />
      )}

      {/* Exit confirmation dialog (desktop) */}
      {toonAfsluitBevestiging && (
        <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-background rounded-3xl p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-foreground mb-1">Meting verlaten?</h3>
            <p className="text-[14px] text-muted-foreground/60 mb-5">
              Alle ingevoerde metingen zijn automatisch opgeslagen. Je kunt later verdergaan.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setToonAfsluitBevestiging(false); navigate(`/projects/${id}`); }}
                className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tenant-primary))] text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
              >
                Ja, verlaten
              </button>
              <button
                onClick={() => setToonAfsluitBevestiging(false)}
                className="w-full py-3.5 rounded-2xl bg-muted/30 text-muted-foreground font-semibold text-[15px] active:scale-[0.98] transition-all"
              >
                Verder meten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
