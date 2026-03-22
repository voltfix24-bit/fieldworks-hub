import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject, useCreateProject, useUpdateProject, useProjects } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { ClientCombobox } from '@/components/ui/ClientCombobox';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList, useDefaultEquipment } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronRight, ChevronDown, Loader2, AlertTriangle, Upload, X, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const MONTEUR_KEY = 'aardpen_laatste_monteur';

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: existing } = useProject(id);
  const { data: defaultEquipment } = useDefaultEquipment();
  const { data: clients } = useClients();
  const { data: technicians } = useTechnicians();
  const { data: equipment } = useEquipmentList();
  const { data: allProjects } = useProjects();
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();

  const activeClients = clients?.filter(c => c.is_active) ?? [];
  const activeTechs = technicians?.filter(t => t.is_active) ?? [];
  const activeEquip = equipment?.filter(e => e.is_active) ?? [];
  const defaultTech = activeTechs.find(t => t.is_default);
  const [duplicaatProject, setDuplicaatProject] = useState<any>(null);
  const [projectBestanden, setProjectBestanden] = useState<File[]>([]);
  const [uploadende, setUploadende] = useState(false);

  const [form, setForm] = useState({
    project_number: '', project_name: '', site_name: '',
    address_line_1: '', postal_code: '', city: '',
    planned_date: '', client_id: '', technician_id: '', equipment_id: '', notes: '',
    target_value: '', housing_number: '', cable_material: '',
  });
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (!isEdit && !defaultsApplied) {
      const laatsteMonteur = localStorage.getItem(MONTEUR_KEY);
      const techId = defaultTech?.id || laatsteMonteur || activeTechs[0]?.id || '';
      const equipId = defaultEquipment?.id || (activeEquip.length === 1 ? activeEquip[0].id : '');
      setForm(prev => ({
        ...prev,
        planned_date: format(new Date(), 'yyyy-MM-dd'),
        equipment_id: equipId,
        technician_id: techId,
      }));
      setDefaultsApplied(true);
    }
  }, [defaultEquipment, defaultTech, isEdit, defaultsApplied, activeTechs, activeEquip]);

  // Remember last used technician
  useEffect(() => {
    if (form.technician_id) {
      localStorage.setItem(MONTEUR_KEY, form.technician_id);
    }
  }, [form.technician_id]);

  // Auto-fill target_value from client's last project
  useEffect(() => {
    if (!form.client_id || !allProjects || form.target_value) return;
    const klantProjecten = allProjects
      .filter(p => p.client_id === form.client_id && (p as any).target_value != null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (klantProjecten[0]) {
      const waarde = String((klantProjecten[0] as any).target_value).replace('.', ',');
      set('target_value', waarde);
      if (!showExtra) setShowExtra(true);
      toast({ description: `Toetswaarde ${waarde} Ω overgenomen van vorig project`, duration: 2500 });
    }
  }, [form.client_id]);

  // Duplicate address detection
  useEffect(() => {
    if (!form.address_line_1 || !form.city || !allProjects) { setDuplicaatProject(null); return; }
    const zoekAdres = `${form.address_line_1} ${form.city}`.toLowerCase().trim();
    const bestaand = allProjects.find(p => {
      const padres = `${p.address_line_1 || ''} ${p.city || ''}`.toLowerCase().trim();
      return padres === zoekAdres && p.id !== id;
    });
    setDuplicaatProject(bestaand || null);
  }, [form.address_line_1, form.city, allProjects]);

  useEffect(() => {
    if (existing) {
      const ex = existing as any;
      setForm({
        project_number: existing.project_number, project_name: existing.project_name,
        site_name: existing.site_name || '', address_line_1: existing.address_line_1 || '',
        postal_code: existing.postal_code || '', city: existing.city || '',
        planned_date: existing.planned_date || '', client_id: existing.client_id || '',
        technician_id: existing.technician_id || '', equipment_id: existing.equipment_id || '',
        notes: existing.notes || '',
        target_value: ex.target_value ? String(ex.target_value) : '',
        housing_number: ex.housing_number || '',
        cable_material: ex.cable_material || '',
      });
      if (existing.site_name || existing.notes || ex.target_value || ex.housing_number || ex.cable_material) setShowExtra(true);
    }
  }, [existing]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!profile?.tenant_id) return;
    const payload: any = {
      tenant_id: profile.tenant_id, project_number: form.project_number,
      project_name: form.project_name, site_name: form.site_name || null,
      address_line_1: form.address_line_1 || null, address_line_2: null,
      postal_code: form.postal_code || null, city: form.city || null, country: null,
      planned_date: form.planned_date || null, status: 'planned' as const,
      client_id: form.client_id || null, technician_id: form.technician_id || null,
      equipment_id: form.equipment_id || null, notes: form.notes || null,
      target_value: parseFloat(form.target_value) || null,
      housing_number: form.housing_number || null,
      cable_material: form.cable_material || null,
    };
    try {
      let savedProject: any;
      if (isEdit) {
        savedProject = await updateMut.mutateAsync({ id, ...payload, status: existing?.status || 'planned' });
        toast({ title: 'Project bijgewerkt' });
      } else {
        savedProject = await createMut.mutateAsync(payload);
        toast({ title: 'Project aangemaakt' });
      }

      // Upload project files
      const projectId = savedProject?.id || id;
      if (projectBestanden.length > 0 && projectId && profile?.tenant_id) {
        setUploadende(true);
        try {
          for (const bestand of projectBestanden) {
            const pad = `${profile.tenant_id}/${projectId}/bestanden/${Date.now()}_${bestand.name}`;
            const { data: uploadData, error } = await supabase.storage
              .from('project-files')
              .upload(pad, bestand, { contentType: bestand.type, upsert: false });
            if (!error && uploadData) {
              await supabase.from('project_attachments').insert({
                tenant_id: profile.tenant_id,
                project_id: projectId,
                file_url: uploadData.path,
                attachment_type: 'project_bestand',
                caption: bestand.name,
              });
            }
          }
        } finally {
          setUploadende(false);
        }
      }

      navigate('/projects');
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    }
  };

  const saving = createMut.isPending || updateMut.isPending || uploadende;
  const canSubmit = form.project_name.trim();

  const clientName = activeClients.find(c => c.id === form.client_id)?.company_name;
  const techName = activeTechs.find(t => t.id === form.technician_id)?.full_name;
  const equipName = activeEquip.find(e => e.id === form.equipment_id)?.device_name;

  const displayDate = form.planned_date
    ? format(new Date(form.planned_date), 'd MMM yyyy', { locale: nl })
    : '';

  return (
    <div className="animate-fade-in max-w-lg mx-auto ios-form-page">
      {/* ───── 1. COMPACT HEADER ───── */}
      <div className="ios-form-header">
        <div className="ios-form-nav-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ios-form-back"
            aria-label="Terug"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="ios-form-title">
            {isEdit ? 'Project bewerken' : 'Nieuw project'}
          </span>
        </div>
        <p className="ios-form-subtitle">
          {isEdit ? 'Pas de gegevens aan' : 'Vul de basis in om te starten'}
        </p>
      </div>

      {/* ───── 2. SCROLL AREA ───── */}
      <div className="ios-form-scroll">

        {/* ── SECTION A: Project ── */}
        <IosLabel>Project</IosLabel>
        <div className="ios-form-card">
          <div className="ios-form-input-row">
            <div className="ios-form-field" style={{ flex: '0 0 115px' }}>
              <span className="ios-form-field-label">Nummer</span>
              <input
                className="ios-form-input ios-font-mono"
                value={form.project_number}
                onChange={e => set('project_number', e.target.value)}
                placeholder="P-2026-001"
              />
            </div>
            <div className="ios-form-field-divider" />
            <div className="ios-form-field" style={{ flex: 1 }}>
              <span className="ios-form-field-label">Projectnaam</span>
              <input
                className="ios-form-input"
                value={form.project_name}
                onChange={e => set('project_name', e.target.value)}
                placeholder="Naam van het project"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION B: Locatie ── */}
        <IosLabel>Locatie</IosLabel>
        <div className="ios-form-card">
          <div className="ios-form-field ios-form-field-full">
            <span className="ios-form-field-label">Straat en huisnummer</span>
            <input
              className="ios-form-input"
              value={form.address_line_1}
              onChange={e => set('address_line_1', e.target.value)}
              placeholder="Hoofdstraat 12"
            />
          </div>
          <div className="ios-form-divider" />
          <div className="ios-form-input-row">
            <div className="ios-form-field" style={{ flex: '0 0 100px' }}>
              <span className="ios-form-field-label">Postcode</span>
              <input
                className="ios-form-input"
                value={form.postal_code}
                onChange={e => set('postal_code', e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="ios-form-field-divider" />
            <div className="ios-form-field" style={{ flex: 1 }}>
              <span className="ios-form-field-label">Plaats</span>
              <input
                className="ios-form-input"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Amsterdam"
              />
            </div>
          </div>

          {/* Duplicate address warning */}
          {duplicaatProject && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 mt-2 mx-4">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">Al een project op dit adres</p>
                <p className="text-[11px] text-amber-600/70 mt-0.5">{duplicaatProject.project_name} · {duplicaatProject.project_number}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/projects/${duplicaatProject.id}`)}
                className="text-[11px] font-semibold text-amber-600 px-2 py-1 rounded-lg bg-amber-500/10 active:scale-95 transition-all shrink-0"
              >
                Bekijken →
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION C: Uitvoering ── */}
        <IosLabel>Uitvoering</IosLabel>
        <div className="ios-form-card">
          {/* Datum */}
          <div className="ios-form-list-row">
            <span className="ios-form-list-label">Datum</span>
            <div className="ios-form-list-value has-value">
              <span>{displayDate}</span>
              <input
                type="date"
                value={form.planned_date}
                onChange={e => set('planned_date', e.target.value)}
                className="ios-form-date-input"
              />
            </div>
          </div>

          <div className="ios-form-divider" />

          {/* Opdrachtgever */}
          <div className="ios-form-field ios-form-field-full px-4 py-2.5">
            <span className="ios-form-field-label">Opdrachtgever</span>
            <ClientCombobox
              value={form.client_id}
              onChange={id => set('client_id', id)}
              clients={activeClients}
              onClientAangemaakt={() => {}}
            />
          </div>

          <div className="ios-form-divider" />

          {/* Monteur */}
          <div className="ios-form-list-row">
            <span className="ios-form-list-label">Monteur</span>
            <Select value={form.technician_id || '__none'} onValueChange={v => set('technician_id', v === '__none' ? '' : v)}>
              <SelectTrigger className="ios-form-select-trigger">
                <span className={cn('truncate', !techName && 'ios-form-placeholder')}>
                  {techName || 'Geen'}
                </span>
                <ChevronRight className="ios-form-chevron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeTechs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}{t.is_default ? ' ★' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="ios-form-divider" />

          {/* Apparaat */}
          <div className="ios-form-list-row">
            <span className="ios-form-list-label">Apparaat</span>
            <Select value={form.equipment_id || '__none'} onValueChange={v => set('equipment_id', v === '__none' ? '' : v)}>
              <SelectTrigger className="ios-form-select-trigger">
                <span className={cn('truncate', !equipName && 'ios-form-placeholder')}>
                  {equipName || 'Geen'}
                </span>
                <ChevronRight className="ios-form-chevron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeEquip.map(e => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ───── 3. OPTIONAL EXTRA ───── */}
        <div className={cn('ios-form-card ios-form-accordion', showExtra && 'is-open')}>
          <button
            type="button"
            className="ios-form-accordion-trigger"
            onClick={() => setShowExtra(v => !v)}
          >
            <span className="ios-form-accordion-label">Extra gegevens</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground/40 transition-transform duration-300',
                showExtra && 'rotate-180'
              )}
            />
          </button>
          <div className={cn('ios-form-accordion-body', showExtra ? 'is-open' : 'is-closed')}>
            <div className="ios-form-accordion-inner">
              <div className="ios-form-field ios-form-field-full">
                <span className="ios-form-field-label">Locatienaam</span>
                <input
                  className="ios-form-input"
                  value={form.site_name}
                  onChange={e => set('site_name', e.target.value)}
                  placeholder="Gebouw of terrein"
                />
              </div>
              <div className="ios-form-divider" />
              <div className="ios-form-field ios-form-field-full">
                <span className="ios-form-field-label">Toetswaarde (Ω)</span>
                <input
                  className="ios-form-input"
                  inputMode="decimal"
                  value={form.target_value}
                  onChange={e => set('target_value', e.target.value)}
                  placeholder="Bijv. 3.00"
                />
                <span className="ios-form-field-hint">Maximaal toegestane aardingsweerstand</span>
              </div>
              <div className="ios-form-divider" />
              <div className="ios-form-field ios-form-field-full">
                <span className="ios-form-field-label">Behuizingsnummer</span>
                <input
                  className="ios-form-input"
                  value={form.housing_number}
                  onChange={e => set('housing_number', e.target.value)}
                  placeholder="Bijv. 7 002 525"
                />
              </div>
              <div className="ios-form-divider" />
              <div className="ios-form-field ios-form-field-full">
                <span className="ios-form-field-label">Leidingmateriaal</span>
                <input
                  className="ios-form-input"
                  value={form.cable_material}
                  onChange={e => set('cable_material', e.target.value)}
                  placeholder="Bijv. Cu 25mm²"
                />
              </div>
              <div className="ios-form-divider" />
              <div className="ios-form-field ios-form-field-full">
                <span className="ios-form-field-label">Notities</span>
                <textarea
                  className="ios-form-textarea"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Eventuele opmerkingen…"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── 4. STICKY BOTTOM CTA ───── */}
      <div className="ios-form-bottom-bar">
        <button
          type="button"
          className="ios-form-cta"
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Opslaan…
            </span>
          ) : isEdit ? 'Opslaan' : 'Project aanmaken'}
        </button>
      </div>
    </div>
  );
}

/* ─── Section label primitive ─── */
function IosLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="ios-form-section-label">{children}</p>
  );
}
