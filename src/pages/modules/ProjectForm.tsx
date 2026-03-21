import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList, useDefaultEquipment } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/* ------------------------------------------------------------------ */
/*  Auto project number helper                                         */
/* ------------------------------------------------------------------ */
function generateProjectNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `P-${y}-${seq}`;
}

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
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();

  const activeClients = clients?.filter(c => c.is_active) ?? [];
  const activeTechs = technicians?.filter(t => t.is_active) ?? [];
  const activeEquip = equipment?.filter(e => e.is_active) ?? [];
  const defaultTech = activeTechs.find(t => t.is_default);

  const autoNumber = useMemo(() => generateProjectNumber(), []);

  const [form, setForm] = useState({
    project_number: '', project_name: '', site_name: '',
    address_line_1: '', postal_code: '', city: '',
    planned_date: '',
    client_id: '', technician_id: '', equipment_id: '', notes: '',
  });

  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  // Apply smart defaults for new projects
  useEffect(() => {
    if (!isEdit && !defaultsApplied) {
      const updates: Partial<typeof form> = {
        project_number: autoNumber,
        planned_date: format(new Date(), 'yyyy-MM-dd'),
      };
      if (defaultEquipment) updates.equipment_id = defaultEquipment.id;
      if (defaultTech) updates.technician_id = defaultTech.id;
      setForm(prev => ({ ...prev, ...updates }));
      setDefaultsApplied(true);
    }
  }, [defaultEquipment, defaultTech, isEdit, defaultsApplied, autoNumber]);

  // Populate form for editing
  useEffect(() => {
    if (existing) {
      setForm({
        project_number: existing.project_number, project_name: existing.project_name,
        site_name: existing.site_name || '', address_line_1: existing.address_line_1 || '',
        postal_code: existing.postal_code || '', city: existing.city || '',
        planned_date: existing.planned_date || '',
        client_id: existing.client_id || '', technician_id: existing.technician_id || '',
        equipment_id: existing.equipment_id || '', notes: existing.notes || '',
      });
      if (existing.site_name || existing.notes) setShowExtra(true);
    }
  }, [existing]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;
    const payload = {
      tenant_id: profile.tenant_id,
      project_number: form.project_number,
      project_name: form.project_name,
      site_name: form.site_name || null,
      address_line_1: form.address_line_1 || null,
      address_line_2: null,
      postal_code: form.postal_code || null,
      city: form.city || null,
      country: null,
      planned_date: form.planned_date || null,
      status: 'planned' as const,
      client_id: form.client_id || null,
      technician_id: form.technician_id || null,
      equipment_id: form.equipment_id || null,
      notes: form.notes || null,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id, ...payload, status: existing?.status || 'planned' });
        toast({ title: 'Project bijgewerkt' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Project aangemaakt' });
      }
      navigate('/projects');
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;
  const canSubmit = form.project_number.trim() && form.project_name.trim();

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-28">
      {/* ─── Compact header ─── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors shrink-0"
          aria-label="Terug"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground tracking-tight leading-tight">
            {isEdit ? 'Project bewerken' : 'Nieuw project'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEdit ? 'Pas de gegevens aan' : 'Vul de basis in om te starten'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ─── Project ─── */}
        <SectionLabel>Project</SectionLabel>
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden divide-y divide-border/30">
          <InlineField label="Nummer">
            <Input
              value={form.project_number}
              onChange={e => set('project_number', e.target.value)}
              required
              placeholder="P-2026-001"
              className="border-0 bg-transparent h-9 text-sm font-mono text-right px-0 focus-visible:ring-0 shadow-none"
            />
          </InlineField>
          <InlineField label="Naam">
            <Input
              value={form.project_name}
              onChange={e => set('project_name', e.target.value)}
              required
              placeholder="Naam van het project"
              className="border-0 bg-transparent h-9 text-sm text-right px-0 focus-visible:ring-0 shadow-none"
            />
          </InlineField>
        </div>

        {/* ─── Locatie ─── */}
        <SectionLabel>Locatie</SectionLabel>
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden divide-y divide-border/30">
          <InlineField label="Adres">
            <Input
              value={form.address_line_1}
              onChange={e => set('address_line_1', e.target.value)}
              placeholder="Straat en huisnummer"
              className="border-0 bg-transparent h-9 text-sm text-right px-0 focus-visible:ring-0 shadow-none"
            />
          </InlineField>
          <InlineField label="Postcode">
            <Input
              value={form.postal_code}
              onChange={e => set('postal_code', e.target.value)}
              placeholder="1234 AB"
              className="border-0 bg-transparent h-9 text-sm text-right px-0 focus-visible:ring-0 shadow-none"
            />
          </InlineField>
          <InlineField label="Plaats">
            <Input
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="Stad"
              className="border-0 bg-transparent h-9 text-sm text-right px-0 focus-visible:ring-0 shadow-none"
            />
          </InlineField>
        </div>

        {/* ─── Uitvoering ─── */}
        <SectionLabel>Uitvoering</SectionLabel>
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden divide-y divide-border/30">
          <InlineField label="Datum">
            <Input
              type="date"
              value={form.planned_date}
              onChange={e => set('planned_date', e.target.value)}
              className="border-0 bg-transparent h-9 text-sm text-right px-0 focus-visible:ring-0 shadow-none w-auto"
            />
          </InlineField>
          <InlineField label="Opdrachtgever">
            <Select value={form.client_id || 'none'} onValueChange={v => set('client_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="border-0 bg-transparent h-9 text-sm shadow-none focus:ring-0 w-auto ml-auto justify-end gap-1.5 px-0">
                <SelectValue placeholder="Geen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen</SelectItem>
                {activeClients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </InlineField>
          <InlineField label="Monteur">
            <Select value={form.technician_id || 'none'} onValueChange={v => set('technician_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="border-0 bg-transparent h-9 text-sm shadow-none focus:ring-0 w-auto ml-auto justify-end gap-1.5 px-0">
                <SelectValue placeholder="Geen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen</SelectItem>
                {activeTechs.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}{t.is_default ? ' ★' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InlineField>
          <InlineField label="Apparaat">
            <Select value={form.equipment_id || 'none'} onValueChange={v => set('equipment_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="border-0 bg-transparent h-9 text-sm shadow-none focus:ring-0 w-auto ml-auto justify-end gap-1.5 px-0">
                <SelectValue placeholder="Geen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen</SelectItem>
                {activeEquip.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.device_name}{e.is_default ? ' ★' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InlineField>
        </div>

        {/* ─── Extra (collapsed) ─── */}
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className="w-full flex items-center justify-between py-2 px-1 text-left group"
        >
          <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            Extra gegevens
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 text-muted-foreground/30 transition-transform duration-200',
            showExtra && 'rotate-180'
          )} />
        </button>
        {showExtra && (
          <div className="rounded-xl bg-card border border-border/40 overflow-hidden divide-y divide-border/30 animate-in fade-in slide-in-from-top-1 duration-200">
            <InlineField label="Locatienaam" stacked>
              <Input
                value={form.site_name}
                onChange={e => set('site_name', e.target.value)}
                placeholder="Gebouw of terrein"
                className="border-0 bg-transparent h-9 text-sm px-0 focus-visible:ring-0 shadow-none"
              />
            </InlineField>
            <div className="px-4 py-3">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Notities</Label>
              <Textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Eventuele opmerkingen…"
                className="border-0 bg-transparent text-sm min-h-[60px] resize-none p-0 focus-visible:ring-0 shadow-none"
              />
            </div>
          </div>
        )}
      </form>

      {/* ─── Sticky CTA ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/30 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3">
        <Button
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          className="w-full h-12 text-[15px] font-semibold rounded-xl"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Opslaan…
            </>
          ) : isEdit ? 'Opslaan' : 'Project aanmaken'}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Apple-style inline row field                                       */
/* ------------------------------------------------------------------ */
function InlineField({ label, children, stacked }: { label: string; children: React.ReactNode; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="px-4 py-3 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {children}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between px-4 min-h-[44px]">
      <Label className="text-sm text-foreground shrink-0 pr-4">{label}</Label>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section label                                                      */
/* ------------------------------------------------------------------ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider px-1 pt-2">
      {children}
    </p>
  );
}
