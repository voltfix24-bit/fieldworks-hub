import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList, useDefaultEquipment } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function genProjectNumber(): string {
  const y = new Date().getFullYear();
  return `P-${y}-${String(Math.floor(Math.random() * 900) + 100)}`;
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
  const autoNumber = useMemo(genProjectNumber, []);

  const [form, setForm] = useState({
    project_number: '', project_name: '', site_name: '',
    address_line_1: '', postal_code: '', city: '',
    planned_date: '', client_id: '', technician_id: '', equipment_id: '', notes: '',
  });
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (!isEdit && !defaultsApplied) {
      setForm(prev => ({
        ...prev,
        project_number: autoNumber,
        planned_date: format(new Date(), 'yyyy-MM-dd'),
        ...(defaultEquipment ? { equipment_id: defaultEquipment.id } : {}),
        ...(defaultTech ? { technician_id: defaultTech.id } : {}),
      }));
      setDefaultsApplied(true);
    }
  }, [defaultEquipment, defaultTech, isEdit, defaultsApplied, autoNumber]);

  useEffect(() => {
    if (existing) {
      setForm({
        project_number: existing.project_number, project_name: existing.project_name,
        site_name: existing.site_name || '', address_line_1: existing.address_line_1 || '',
        postal_code: existing.postal_code || '', city: existing.city || '',
        planned_date: existing.planned_date || '', client_id: existing.client_id || '',
        technician_id: existing.technician_id || '', equipment_id: existing.equipment_id || '',
        notes: existing.notes || '',
      });
      if (existing.site_name || existing.notes) setShowExtra(true);
    }
  }, [existing]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!profile?.tenant_id) return;
    const payload = {
      tenant_id: profile.tenant_id, project_number: form.project_number,
      project_name: form.project_name, site_name: form.site_name || null,
      address_line_1: form.address_line_1 || null, address_line_2: null,
      postal_code: form.postal_code || null, city: form.city || null, country: null,
      planned_date: form.planned_date || null, status: 'planned' as const,
      client_id: form.client_id || null, technician_id: form.technician_id || null,
      equipment_id: form.equipment_id || null, notes: form.notes || null,
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

  const clientName = activeClients.find(c => c.id === form.client_id)?.company_name;
  const techName = activeTechs.find(t => t.id === form.technician_id)?.full_name;
  const equipName = activeEquip.find(e => e.id === form.equipment_id)?.device_name;

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-28">
      {/* ───── 1. COMPACT HEADER ───── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-8 w-8 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.08] flex items-center justify-center transition-colors shrink-0"
          aria-label="Terug"
        >
          <ArrowLeft className="h-[15px] w-[15px] text-foreground/60" />
        </button>
        <div>
          <h1 className="text-[17px] font-semibold text-foreground leading-snug">
            {isEdit ? 'Project bewerken' : 'Nieuw project'}
          </h1>
          <p className="text-[12px] text-muted-foreground/45 leading-snug">
            {isEdit ? 'Pas de gegevens aan' : 'Vul de basis in om te starten'}
          </p>
        </div>
      </div>

      {/* ───── 2. MAIN FORM CARD ───── */}
      <div className="ios-group overflow-hidden">

        {/* ── SECTION A: Project ── */}
        <SectionTitle>Project</SectionTitle>
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-[105px_1fr] gap-2">
            <div>
              <FieldLabel>Projectnummer</FieldLabel>
              <Input
                value={form.project_number}
                onChange={e => set('project_number', e.target.value)}
                required
                placeholder="P-2026-001"
                className="h-10 text-[13px] font-mono bg-foreground/[0.03] border-border/20 rounded-lg"
              />
            </div>
            <div>
              <FieldLabel>Projectnaam</FieldLabel>
              <Input
                value={form.project_name}
                onChange={e => set('project_name', e.target.value)}
                required
                placeholder="Naam van het project"
                className="h-10 text-[13px] bg-foreground/[0.03] border-border/20 rounded-lg"
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* ── SECTION B: Locatie ── */}
        <SectionTitle>Locatie</SectionTitle>
        <div className="px-4 pb-3 space-y-2">
          <div>
            <FieldLabel>Straat en huisnummer</FieldLabel>
            <Input
              value={form.address_line_1}
              onChange={e => set('address_line_1', e.target.value)}
              placeholder="Hoofdstraat 12"
              className="h-10 text-[13px] bg-foreground/[0.03] border-border/20 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div>
              <FieldLabel>Postcode</FieldLabel>
              <Input
                value={form.postal_code}
                onChange={e => set('postal_code', e.target.value)}
                placeholder="1234 AB"
                className="h-10 text-[13px] bg-foreground/[0.03] border-border/20 rounded-lg"
              />
            </div>
            <div>
              <FieldLabel>Plaats</FieldLabel>
              <Input
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Amsterdam"
                className="h-10 text-[13px] bg-foreground/[0.03] border-border/20 rounded-lg"
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* ── SECTION C: Uitvoering ── */}
        <SectionTitle>Uitvoering</SectionTitle>
        <div className="divide-y divide-border/15">
          <RowField label="Datum">
            <Input
              type="date"
              value={form.planned_date}
              onChange={e => set('planned_date', e.target.value)}
              className="border-0 bg-transparent h-9 text-[13px] text-right p-0 focus-visible:ring-0 shadow-none w-[130px]"
            />
          </RowField>
          <RowField label="Opdrachtgever">
            <Select value={form.client_id || '__none'} onValueChange={v => set('client_id', v === '__none' ? '' : v)}>
              <SelectTrigger className="border-0 bg-transparent h-9 text-[13px] shadow-none focus:ring-0 p-0 w-auto gap-1 justify-end text-right [&>svg]:hidden">
                <span className={cn('truncate', !clientName && 'text-muted-foreground/50')}>
                  {clientName || 'Geen'}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeClients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </RowField>
          <RowField label="Monteur">
            <Select value={form.technician_id || '__none'} onValueChange={v => set('technician_id', v === '__none' ? '' : v)}>
              <SelectTrigger className="border-0 bg-transparent h-9 text-[13px] shadow-none focus:ring-0 p-0 w-auto gap-1 justify-end text-right [&>svg]:hidden">
                <span className={cn('truncate', !techName && 'text-muted-foreground/50')}>
                  {techName || 'Geen'}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeTechs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}{t.is_default ? ' ★' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </RowField>
          <RowField label="Apparaat">
            <Select value={form.equipment_id || '__none'} onValueChange={v => set('equipment_id', v === '__none' ? '' : v)}>
              <SelectTrigger className="border-0 bg-transparent h-9 text-[13px] shadow-none focus:ring-0 p-0 w-auto gap-1 justify-end text-right [&>svg]:hidden">
                <span className={cn('truncate', !equipName && 'text-muted-foreground/50')}>
                  {equipName || 'Geen'}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeEquip.map(e => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </RowField>
        </div>
      </div>

      {/* ───── 3. OPTIONAL EXTRA ───── */}
      <button
        type="button"
        onClick={() => setShowExtra(!showExtra)}
        className="w-full flex items-center justify-between py-2.5 px-1 mt-3 group"
      >
        <span className="text-[12px] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
          Extra gegevens
        </span>
        <ChevronRight className={cn(
          'h-3.5 w-3.5 text-muted-foreground/20 transition-transform duration-200',
          showExtra && 'rotate-90'
        )} />
      </button>
      {showExtra && (
        <div className="ios-group overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-4 py-3 space-y-3">
            <div>
              <FieldLabel>Locatienaam</FieldLabel>
              <Input
                value={form.site_name}
                onChange={e => set('site_name', e.target.value)}
                placeholder="Gebouw of terrein"
                className="h-10 text-[13px] bg-foreground/[0.03] border-border/20 rounded-lg"
              />
            </div>
            <div>
              <FieldLabel>Notities</FieldLabel>
              <Textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Eventuele opmerkingen…"
                className="text-[13px] min-h-[56px] resize-none bg-foreground/[0.03] border-border/20 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ───── 4. STICKY BOTTOM CTA ───── */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-4">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          className="relative w-full h-[50px] text-[15px] font-semibold rounded-2xl shadow-sm"
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

/* ─── Primitives ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider px-4 pt-4 pb-1.5">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1">{children}</label>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-border/15" />;
}

function RowField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pl-4 pr-3 min-h-[44px] ios-row">
      <span className="text-[13px] text-foreground shrink-0">{label}</span>
      <div className="flex items-center justify-end min-w-0 ml-3">{children}</div>
    </div>
  );
}
