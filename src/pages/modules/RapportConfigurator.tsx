import { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  CalendarIcon, Plus, X, ChevronDown, Loader2, Download, FileText,
  Upload, Image as ImageIcon, Building2, FolderKanban, Wrench, Zap, PenTool,
} from 'lucide-react';

// ─── TYPES ───

interface Meting {
  diepte: number | null;
  waarden: (number | null)[];
}

interface Elektrode {
  nummer: number;
  rv: string;
  norm: string;
  rv_ok: boolean;
  aantalPennen: 1 | 2;
  pennen_gekoppeld: boolean;
  metingen: Meting[];
  foto_display_b64: string | null;
  foto_overzicht_b64: string | null;
}

interface FormState {
  // Bedrijf
  company_name: string;
  company_address: string;
  company_email: string;
  company_website: string;
  kvk: string;
  certificaten: string;
  brand_color_hex: string;
  // Project
  doc_nummer: string;
  doc_revisie: string;
  project_nr: string;
  project_naam: string;
  project_adres: string;
  meetdatum: Date | undefined;
  toetswaarde: string;
  opdrachtgever_bedrijf: string;
  opdrachtgever_contact: string;
  behuizingsnummer: string;
  leidingmateriaal: string;
  monteur: string;
  gebruik_rv: boolean;
  // Apparatuur
  apparaat_naam: string;
  apparaat_serie: string;
  meetmethode: string;
  kalibratie_datum: Date | undefined;
  kalibratie_volgende: Date | undefined;
  kalibratie_instituut: string;
  // Handtekening
  handtekening_b64: string | null;
}

const DEFAULT_STATE: FormState = {
  company_name: 'Aardpen-slaan.nl',
  company_address: 'Anthony Fokkerweg 66, Rotterdam',
  company_email: 'info@aardpen-slaan.nl',
  company_website: 'aardpen-slaan.nl',
  kvk: '12345678',
  certificaten: 'VCA** gecertificeerd · ISO 9001:2015',
  brand_color_hex: '#A43700',
  doc_nummer: 'RPT-2026-00001',
  doc_revisie: 'A — Definitief',
  project_nr: '',
  project_naam: '',
  project_adres: '',
  meetdatum: undefined,
  toetswaarde: '1,00 Ω',
  opdrachtgever_bedrijf: '',
  opdrachtgever_contact: '',
  behuizingsnummer: '',
  leidingmateriaal: '',
  monteur: '',
  gebruik_rv: true,
  apparaat_naam: '',
  apparaat_serie: '',
  meetmethode: '3-punts aardverspreidingsweerstand',
  kalibratie_datum: undefined,
  kalibratie_volgende: undefined,
  kalibratie_instituut: '',
  handtekening_b64: null,
};

function createElektrode(nummer: number): Elektrode {
  return {
    nummer,
    rv: '',
    norm: '1,00 Ω',
    rv_ok: true,
    aantalPennen: 1,
    pennen_gekoppeld: false,
    metingen: [{ diepte: 3, waarden: [null] }],
    foto_display_b64: null,
    foto_overzicht_b64: null,
  };
}

// ─── HELPERS ───

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateForApi(date: Date | undefined): string {
  if (!date) return '';
  return format(date, 'dd-MM-yyyy');
}

// ─── SUBCOMPONENTS ───

function DatePickerField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-[#191C1E]/60">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-9 text-[13px] rounded-lg border-[#191C1E]/10',
              !value && 'text-[#191C1E]/30'
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(value, 'dd-MM-yyyy') : 'Selecteer datum'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={nl}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-[#191C1E]/60">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-[13px] rounded-lg border-[#191C1E]/10"
      />
    </div>
  );
}

function PhotoUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (b64: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    onChange(b64);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-[#191C1E]/60">{label}</Label>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative rounded-lg border border-[#191C1E]/10 p-2 bg-white">
          <img
            src={`data:image/png;base64,${value}`}
            alt={label}
            className="w-full h-24 object-contain rounded"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-full h-20 border-2 border-dashed border-[#191C1E]/10 rounded-lg flex flex-col items-center justify-center gap-1 text-[#191C1E]/30 hover:border-[#A43700]/30 hover:text-[#A43700]/50 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span className="text-[11px]">Upload foto</span>
        </button>
      )}
    </div>
  );
}

// ─── ELEKTRODE PANEL ───

function ElektrodePanel({
  elektrode,
  onUpdate,
  onRemove,
}: {
  elektrode: Elektrode;
  onUpdate: (e: Elektrode) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  const updateMeting = (idx: number, field: keyof Meting, val: any) => {
    const metingen = [...elektrode.metingen];
    metingen[idx] = { ...metingen[idx], [field]: val };
    onUpdate({ ...elektrode, metingen });
  };

  const updateMetingWaarde = (metingIdx: number, penIdx: number, val: string) => {
    const metingen = [...elektrode.metingen];
    const waarden = [...metingen[metingIdx].waarden];
    waarden[penIdx] = val === '' ? null : parseFloat(val.replace(',', '.'));
    metingen[metingIdx] = { ...metingen[metingIdx], waarden };
    onUpdate({ ...elektrode, metingen });
  };

  const setAantalPennen = (n: 1 | 2) => {
    const metingen = elektrode.metingen.map((m) => ({
      ...m,
      waarden: n === 1 ? [m.waarden[0] ?? null] : [m.waarden[0] ?? null, m.waarden[1] ?? null],
    }));
    onUpdate({ ...elektrode, aantalPennen: n, metingen, pennen_gekoppeld: n === 1 ? false : elektrode.pennen_gekoppeld });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-[#191C1E]/8 bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#191C1E]/[0.02] transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#A43700]/10 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-[#A43700]" />
              </div>
              <span className="text-[13px] font-semibold text-[#191C1E]">
                Elektrode {elektrode.nummer}
              </span>
              {elektrode.rv && (
                <span className="text-[11px] text-[#191C1E]/40 ml-1">
                  {elektrode.rv}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-[#191C1E]/20 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <ChevronDown className={cn('h-4 w-4 text-[#191C1E]/20 transition-transform', open && 'rotate-180')} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[#191C1E]/5">
            {/* Nummer (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#191C1E]/60">Elektrodenummer</Label>
              <Input value={elektrode.nummer} disabled className="h-9 text-[13px] rounded-lg bg-[#191C1E]/[0.03]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="RV/RA waarde"
                value={elektrode.rv}
                onChange={(v) => onUpdate({ ...elektrode, rv: v })}
                required
                placeholder="0,97 Ω"
              />
              <FormField
                label="Norm"
                value={elektrode.norm}
                onChange={(v) => onUpdate({ ...elektrode, norm: v })}
                required
                placeholder="1,00 Ω"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <Label className="text-[12px] font-medium text-[#191C1E]/60">Voldoet aan norm</Label>
              <Switch checked={elektrode.rv_ok} onCheckedChange={(v) => onUpdate({ ...elektrode, rv_ok: v })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-[#191C1E]/60">Aantal pennen</Label>
                <Select
                  value={String(elektrode.aantalPennen)}
                  onValueChange={(v) => setAantalPennen(Number(v) as 1 | 2)}
                >
                  <SelectTrigger className="h-9 text-[13px] rounded-lg border-[#191C1E]/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 pen</SelectItem>
                    <SelectItem value="2">2 pennen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {elektrode.aantalPennen === 2 && (
                <div className="flex items-center justify-between py-1">
                  <Label className="text-[12px] font-medium text-[#191C1E]/60">Pennen gekoppeld</Label>
                  <Switch
                    checked={elektrode.pennen_gekoppeld}
                    onCheckedChange={(v) => onUpdate({ ...elektrode, pennen_gekoppeld: v })}
                  />
                </div>
              )}
            </div>

            {/* Meetwaarden tabel */}
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-[#191C1E]/60">Meetwaarden</Label>
              <div className="rounded-lg border border-[#191C1E]/8 overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-[#191C1E]/[0.03]">
                      <th className="text-left px-3 py-2 font-medium text-[#191C1E]/50">Diepte (m)</th>
                      <th className="text-left px-3 py-2 font-medium text-[#191C1E]/50">Pen 1 (Ω)</th>
                      {elektrode.aantalPennen === 2 && (
                        <th className="text-left px-3 py-2 font-medium text-[#191C1E]/50">Pen 2 (Ω)</th>
                      )}
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {elektrode.metingen.map((m, i) => (
                      <tr key={i} className="border-t border-[#191C1E]/5">
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={m.diepte ?? ''}
                            onChange={(e) => updateMeting(i, 'diepte', e.target.value === '' ? null : Number(e.target.value))}
                            className="h-7 text-[12px] rounded border-[#191C1E]/10 w-20"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={m.waarden[0] === null ? '' : String(m.waarden[0])}
                            onChange={(e) => updateMetingWaarde(i, 0, e.target.value)}
                            className="h-7 text-[12px] rounded border-[#191C1E]/10 w-20"
                            inputMode="decimal"
                          />
                        </td>
                        {elektrode.aantalPennen === 2 && (
                          <td className="px-2 py-1.5">
                            <Input
                              value={m.waarden[1] === null ? '' : String(m.waarden[1] ?? '')}
                              onChange={(e) => updateMetingWaarde(i, 1, e.target.value)}
                              className="h-7 text-[12px] rounded border-[#191C1E]/10 w-20"
                              inputMode="decimal"
                            />
                          </td>
                        )}
                        <td className="px-1 py-1.5">
                          {elektrode.metingen.length > 1 && (
                            <button
                              onClick={() => {
                                const metingen = elektrode.metingen.filter((_, j) => j !== i);
                                onUpdate({ ...elektrode, metingen });
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#191C1E]/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => {
                  const lastDepth = elektrode.metingen[elektrode.metingen.length - 1]?.diepte ?? 0;
                  const newMeting: Meting = {
                    diepte: (lastDepth ?? 0) + 3,
                    waarden: elektrode.aantalPennen === 2 ? [null, null] : [null],
                  };
                  onUpdate({ ...elektrode, metingen: [...elektrode.metingen, newMeting] });
                }}
                className="text-[12px] text-[#A43700] font-medium flex items-center gap-1 hover:text-[#A43700]/70 transition-colors"
              >
                <Plus className="h-3 w-3" /> Rij toevoegen
              </button>
            </div>

            {/* Foto uploads */}
            <div className="grid grid-cols-2 gap-3">
              <PhotoUploadField
                label="Foto meetdisplay"
                value={elektrode.foto_display_b64}
                onChange={(v) => onUpdate({ ...elektrode, foto_display_b64: v })}
              />
              <PhotoUploadField
                label="Overzichtsfoto aardpen"
                value={elektrode.foto_overzicht_b64}
                onChange={(v) => onUpdate({ ...elektrode, foto_overzicht_b64: v })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── MAIN COMPONENT ───

export default function RapportConfigurator() {
  const [form, setForm] = useState<FormState>({ ...DEFAULT_STATE });
  const [elektrodes, setElektrodes] = useState<Elektrode[]>([createElektrode(1)]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const updateElektrode = (idx: number, updated: Elektrode) => {
    setElektrodes((prev) => prev.map((e, i) => (i === idx ? updated : e)));
  };

  const removeElektrode = (idx: number) => {
    setElektrodes((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((e, i) => ({ ...e, nummer: i + 1 }));
    });
  };

  const addElektrode = () => {
    setElektrodes((prev) => [...prev, createElektrode(prev.length + 1)]);
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.project_nr) errs.push('Projectnummer is verplicht');
    if (!form.project_naam) errs.push('Projectnaam is verplicht');
    if (!form.project_adres) errs.push('Projectadres is verplicht');
    if (!form.meetdatum) errs.push('Meetdatum is verplicht');
    if (!form.opdrachtgever_bedrijf) errs.push('Opdrachtgever bedrijf is verplicht');
    if (!form.monteur) errs.push('Monteur is verplicht');
    if (!form.apparaat_naam) errs.push('Apparaat naam is verplicht');
    if (!form.apparaat_serie) errs.push('Serienummer is verplicht');
    if (!form.kalibratie_datum) errs.push('Kalibratiedatum is verplicht');
    if (elektrodes.length === 0) errs.push('Minimaal één elektrode is vereist');
    elektrodes.forEach((e) => {
      if (!e.rv) errs.push(`Elektrode ${e.nummer}: RV/RA waarde is verplicht`);
    });
    return errs;
  };

  const buildPayload = () => {
    return {
      company_name: form.company_name,
      company_address: form.company_address,
      company_email: form.company_email,
      company_website: form.company_website,
      kvk: form.kvk,
      certificaten: form.certificaten,
      brand_color_hex: form.brand_color_hex,
      doc_nummer: form.doc_nummer,
      doc_revisie: form.doc_revisie,
      project_nr: form.project_nr,
      project_naam: form.project_naam,
      project_adres: form.project_adres,
      meetdatum: formatDateForApi(form.meetdatum),
      toetswaarde: form.toetswaarde,
      gebruik_rv: form.gebruik_rv,
      opdrachtgever_bedrijf: form.opdrachtgever_bedrijf,
      opdrachtgever_contact: form.opdrachtgever_contact || undefined,
      behuizingsnummer: form.behuizingsnummer || undefined,
      leidingmateriaal: form.leidingmateriaal || undefined,
      monteur: form.monteur,
      apparaat_naam: form.apparaat_naam,
      apparaat_serie: form.apparaat_serie,
      meetmethode: form.meetmethode || undefined,
      kalibratie_datum: formatDateForApi(form.kalibratie_datum),
      kalibratie_volgende: form.kalibratie_volgende ? formatDateForApi(form.kalibratie_volgende) : undefined,
      kalibratie_instituut: form.kalibratie_instituut || undefined,
      handtekening_b64: form.handtekening_b64 || undefined,
      elektrodes: elektrodes.map((e) => ({
        nummer: e.nummer,
        rv: e.rv,
        norm: e.norm,
        rv_ok: e.rv_ok,
        pen_labels: e.aantalPennen === 2 ? ['Pen 1 (Ω)', 'Pen 2 (Ω)'] : ['Pen 1 (Ω)'],
        pennen_gekoppeld: e.pennen_gekoppeld,
        metingen: e.metingen.map((m) => ({
          diepte: m.diepte ?? 0,
          waarden: m.waarden,
        })),
        foto_display_b64: e.foto_display_b64 || undefined,
        foto_overzicht_b64: e.foto_overzicht_b64 || undefined,
      })),
    };
  };

  const handleGenerate = async () => {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      toast({ title: 'Validatiefouten', description: `${errs.length} veld(en) niet ingevuld`, variant: 'destructive' });
      return;
    }
    setErrors([]);
    setLoading(true);

    try {
      const payload = buildPayload();
      const resp = await fetch('https://web-production-25723.up.railway.app/rapport/genereer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API fout (${resp.status}): ${errText}`);
      }

      const blob = await resp.blob();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast({ title: 'PDF gegenereerd', description: 'Het rapport staat klaar in het preview venster.' });
    } catch (err) {
      toast({
        title: 'Genereren mislukt',
        description: err instanceof Error ? err.message : 'Onbekende fout opgetreden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${form.doc_nummer || 'rapport'}.pdf`;
    a.click();
  };

  const handtekeningRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" style={{ background: '#F8F9FB' }}>
      {/* Full-width generate button */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-xl text-[14px] font-semibold h-11 text-white"
          style={{ backgroundColor: '#A43700' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          {loading ? 'Genereren…' : 'Genereer PDF'}
        </Button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-[12px] font-semibold text-red-700 mb-1">Controleer de volgende velden:</p>
          <ul className="text-[11px] text-red-600 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main split */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel — 42% */}
        <div className="w-[42%] border-r border-[#191C1E]/8 overflow-y-auto p-4 sticky top-0">
          <Tabs defaultValue="bedrijf" className="w-full">
            <TabsList className="w-full grid grid-cols-5 rounded-xl h-9 bg-[#191C1E]/[0.04] p-0.5">
              <TabsTrigger value="bedrijf" className="text-[11px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Building2 className="h-3 w-3 mr-1" /> Bedrijf
              </TabsTrigger>
              <TabsTrigger value="project" className="text-[11px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FolderKanban className="h-3 w-3 mr-1" /> Project
              </TabsTrigger>
              <TabsTrigger value="apparatuur" className="text-[11px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Wrench className="h-3 w-3 mr-1" /> Apparatuur
              </TabsTrigger>
              <TabsTrigger value="elektrodes" className="text-[11px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Zap className="h-3 w-3 mr-1" /> Elektrodes
              </TabsTrigger>
              <TabsTrigger value="handtekening" className="text-[11px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <PenTool className="h-3 w-3 mr-1" /> Teken
              </TabsTrigger>
            </TabsList>

            {/* TAB: BEDRIJF */}
            <TabsContent value="bedrijf" className="mt-4 space-y-3">
              <FormField label="Bedrijfsnaam" value={form.company_name} onChange={(v) => set('company_name', v)} required />
              <FormField label="Adres" value={form.company_address} onChange={(v) => set('company_address', v)} required />
              <FormField label="E-mail" value={form.company_email} onChange={(v) => set('company_email', v)} type="email" required />
              <FormField label="Website" value={form.company_website} onChange={(v) => set('company_website', v)} required />
              <FormField label="KvK nummer" value={form.kvk} onChange={(v) => set('kvk', v)} />
              <FormField label="Certificaten" value={form.certificaten} onChange={(v) => set('certificaten', v)} />
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-[#191C1E]/60">Merkkleur</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.brand_color_hex}
                    onChange={(e) => set('brand_color_hex', e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#191C1E]/10 cursor-pointer"
                  />
                  <Input
                    value={form.brand_color_hex}
                    onChange={(e) => set('brand_color_hex', e.target.value)}
                    className="h-9 text-[13px] rounded-lg border-[#191C1E]/10 font-mono w-28"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: PROJECT */}
            <TabsContent value="project" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Documentnummer" value={form.doc_nummer} onChange={(v) => set('doc_nummer', v)} />
                <FormField label="Revisie" value={form.doc_revisie} onChange={(v) => set('doc_revisie', v)} />
              </div>
              <FormField label="Projectnummer" value={form.project_nr} onChange={(v) => set('project_nr', v)} required placeholder="PRJ-2026-001" />
              <FormField label="Projectnaam" value={form.project_naam} onChange={(v) => set('project_naam', v)} required placeholder="Nieuwbouw kantoor" />
              <FormField label="Projectadres" value={form.project_adres} onChange={(v) => set('project_adres', v)} required placeholder="Straat 1, Stad" />
              <DatePickerField label="Meetdatum" value={form.meetdatum} onChange={(v) => set('meetdatum', v)} required />
              <FormField label="Toetswaarde" value={form.toetswaarde} onChange={(v) => set('toetswaarde', v)} required />
              <FormField label="Opdrachtgever bedrijf" value={form.opdrachtgever_bedrijf} onChange={(v) => set('opdrachtgever_bedrijf', v)} required />
              <FormField label="Contactpersoon" value={form.opdrachtgever_contact} onChange={(v) => set('opdrachtgever_contact', v)} placeholder="Optioneel" />
              <FormField label="Behuizingsnummer" value={form.behuizingsnummer} onChange={(v) => set('behuizingsnummer', v)} placeholder="Optioneel" />
              <FormField label="Leidingmateriaal" value={form.leidingmateriaal} onChange={(v) => set('leidingmateriaal', v)} placeholder="Optioneel" />
              <FormField label="Monteur" value={form.monteur} onChange={(v) => set('monteur', v)} required />
              <div className="flex items-center justify-between py-1">
                <Label className="text-[12px] font-medium text-[#191C1E]/60">Meettype</Label>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[12px] font-medium', form.gebruik_rv ? 'text-[#A43700]' : 'text-[#191C1E]/30')}>RV</span>
                  <Switch checked={!form.gebruik_rv} onCheckedChange={(v) => set('gebruik_rv', !v)} />
                  <span className={cn('text-[12px] font-medium', !form.gebruik_rv ? 'text-[#534AB7]' : 'text-[#191C1E]/30')}>RA</span>
                </div>
              </div>
            </TabsContent>

            {/* TAB: APPARATUUR */}
            <TabsContent value="apparatuur" className="mt-4 space-y-3">
              <FormField label="Merk & type" value={form.apparaat_naam} onChange={(v) => set('apparaat_naam', v)} required placeholder="Megger DET4TCR2" />
              <FormField label="Serienummer" value={form.apparaat_serie} onChange={(v) => set('apparaat_serie', v)} required />
              <FormField label="Meetmethode" value={form.meetmethode} onChange={(v) => set('meetmethode', v)} />
              <DatePickerField label="Kalibratiedatum" value={form.kalibratie_datum} onChange={(v) => set('kalibratie_datum', v)} required />
              <DatePickerField label="Volgende kalibratie" value={form.kalibratie_volgende} onChange={(v) => set('kalibratie_volgende', v)} />
              <FormField label="Kalibratie instituut" value={form.kalibratie_instituut} onChange={(v) => set('kalibratie_instituut', v)} placeholder="Optioneel" />
            </TabsContent>

            {/* TAB: ELEKTRODES */}
            <TabsContent value="elektrodes" className="mt-4 space-y-3">
              {elektrodes.map((e, i) => (
                <ElektrodePanel
                  key={e.nummer}
                  elektrode={e}
                  onUpdate={(updated) => updateElektrode(i, updated)}
                  onRemove={() => removeElektrode(i)}
                />
              ))}
              <button
                onClick={addElektrode}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#A43700]/20 text-[#A43700] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:border-[#A43700]/40 hover:bg-[#A43700]/[0.03] transition-colors"
              >
                <Plus className="h-4 w-4" /> Elektrode toevoegen
              </button>
            </TabsContent>

            {/* TAB: HANDTEKENING */}
            <TabsContent value="handtekening" className="mt-4 space-y-3">
              <input
                ref={handtekeningRef}
                type="file"
                accept="image/png,image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const b64 = await readFileAsBase64(file);
                  set('handtekening_b64', b64);
                }}
              />
              {form.handtekening_b64 ? (
                <div className="space-y-3">
                  <Label className="text-[12px] font-medium text-[#191C1E]/60">Handtekening preview</Label>
                  <div className="relative rounded-xl border border-[#191C1E]/10 p-4 bg-white">
                    <img
                      src={`data:image/png;base64,${form.handtekening_b64}`}
                      alt="Handtekening"
                      className="w-full h-32 object-contain"
                    />
                    <button
                      onClick={() => set('handtekening_b64', null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handtekeningRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-[#191C1E]/10 rounded-xl flex flex-col items-center justify-center gap-2 text-[#191C1E]/30 hover:border-[#A43700]/30 hover:text-[#A43700]/50 transition-colors"
                >
                  <PenTool className="h-6 w-6" />
                  <span className="text-[13px] font-medium">Upload handtekening (PNG)</span>
                  <span className="text-[11px]">Klik om een bestand te selecteren</span>
                </button>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — 58% PDF preview */}
        <div className="w-[58%] flex flex-col bg-[#191C1E]/[0.03]">
          {pdfUrl ? (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#191C1E]/8 bg-white shrink-0">
                <span className="text-[12px] font-semibold text-[#191C1E]/60">PDF Preview</span>
                <Button
                  onClick={handleDownloadPdf}
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-[12px] h-8"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                </Button>
              </div>
              <iframe
                src={pdfUrl}
                className="flex-1 w-full"
                title="PDF preview"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#191C1E]/[0.05] flex items-center justify-center mx-auto">
                  <FileText className="h-7 w-7 text-[#191C1E]/15" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#191C1E]/30">Nog geen rapport</p>
                  <p className="text-[12px] text-[#191C1E]/20 mt-0.5">
                    Vul de gegevens in en klik op "Genereer PDF"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
