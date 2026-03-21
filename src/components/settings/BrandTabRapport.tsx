import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface BrandTabRapportProps {
  form: Record<string, any>;
  updateField: (key: string, value: any) => void;
}

function SectionToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function FieldToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
  );
}

export function BrandTabRapport({ form, updateField }: BrandTabRapportProps) {
  const sections = form.report_sections || {};
  const fields = form.report_fields || {};

  const setSec = (key: string, val: boolean) => updateField('report_sections', { ...sections, [key]: val });
  const setField = (key: string, val: boolean) => updateField('report_fields', { ...fields, [key]: val });

  return (
    <div className="space-y-6">
      {/* Report identity */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Rapport identiteit</h3>
        <div>
          <Label className="text-xs text-muted-foreground">Rapporttitel</Label>
          <Input value={form.report_title || ''} onChange={e => updateField('report_title', e.target.value)} placeholder="Aardingsmeting Rapport" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Ondertitel (optioneel)</Label>
          <Input value={form.report_subtitle || ''} onChange={e => updateField('report_subtitle', e.target.value)} placeholder="" className="mt-1" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Logo in rapport</Label>
          <Switch checked={form.report_show_logo !== false} onCheckedChange={v => updateField('report_show_logo', v)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Logo grootte</Label>
          <Select value={form.report_logo_size || 'medium'} onValueChange={v => updateField('report_logo_size', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Klein</SelectItem>
              <SelectItem value="medium">Standaard</SelectItem>
              <SelectItem value="large">Groot</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Rapportindeling</h3>
        <div>
          <Label className="text-xs text-muted-foreground">Dichtheid</Label>
          <Select value={form.report_density || 'standard'} onValueChange={v => updateField('report_density', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="standard">Standaard</SelectItem>
              <SelectItem value="spacious">Uitgebreid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tabelstijl</Label>
          <Select value={form.report_table_style || 'standard'} onValueChange={v => updateField('report_table_style', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="standard">Standaard</SelectItem>
              <SelectItem value="spacious">Ruim</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SectionToggle label="Paginanummers" checked={form.report_page_numbers !== false} onChange={v => updateField('report_page_numbers', v)} />
        <SectionToggle label="Footer op elke pagina" checked={form.report_footer_every_page !== false} onChange={v => updateField('report_footer_every_page', v)} />
        <SectionToggle label="Header op elke pagina" checked={form.report_header_every_page === true} onChange={v => updateField('report_header_every_page', v)} />
        <div>
          <Label className="text-xs text-muted-foreground">Foto's groeperen per</Label>
          <Select value={form.report_photo_grouping || 'electrode'} onValueChange={v => updateField('report_photo_grouping', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="electrode">Elektrode</SelectItem>
              <SelectItem value="pen">Pen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Section visibility */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Rapportsecties</h3>
        <p className="text-xs text-muted-foreground">Secties worden alleen getoond als ze zijn ingeschakeld én relevante data bevatten.</p>
        <div className="space-y-0.5">
          <SectionToggle label="Projectgegevens" checked={sections.projectgegevens !== false} onChange={v => setSec('projectgegevens', v)} />
          <SectionToggle label="Opdrachtgever" checked={sections.opdrachtgever !== false} onChange={v => setSec('opdrachtgever', v)} />
          <SectionToggle label="Monteur" checked={sections.monteur !== false} onChange={v => setSec('monteur', v)} />
          <SectionToggle label="Meetapparatuur" checked={sections.meetapparatuur !== false} onChange={v => setSec('meetapparatuur', v)} />
          <SectionToggle label="Meetresultaten" checked={sections.meetresultaten !== false} onChange={v => setSec('meetresultaten', v)} />
          <SectionToggle label="Foto's" checked={sections.fotos !== false} onChange={v => setSec('fotos', v)} />
          <SectionToggle label="Schets en bijlagen" checked={sections.schets !== false} onChange={v => setSec('schets', v)} />
          <SectionToggle label="Notities" checked={sections.notities !== false} onChange={v => setSec('notities', v)} />
          <SectionToggle label="Ondertekening" checked={sections.ondertekening === true} onChange={v => setSec('ondertekening', v)} />
        </div>
      </div>

      <Separator />

      {/* Field visibility */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Veld-zichtbaarheid</h3>
        <p className="text-xs text-muted-foreground">Bepaal welke velden per sectie worden getoond in het rapport.</p>

        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Projectgegevens</p>
          <FieldToggle label="Projectnummer" checked={fields.projectnummer !== false} onChange={v => setField('projectnummer', v)} />
          <FieldToggle label="Projectnaam" checked={fields.projectnaam !== false} onChange={v => setField('projectnaam', v)} />
          <FieldToggle label="Adres" checked={fields.adres !== false} onChange={v => setField('adres', v)} />
          <FieldToggle label="Meetdatum" checked={fields.meetdatum !== false} onChange={v => setField('meetdatum', v)} />
          <FieldToggle label="Werkordernummer" checked={fields.werkordernummer === true} onChange={v => setField('werkordernummer', v)} />
        </div>

        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Opdrachtgever</p>
          <FieldToggle label="Bedrijfsnaam" checked={fields.opdrachtgever_bedrijf !== false} onChange={v => setField('opdrachtgever_bedrijf', v)} />
          <FieldToggle label="Contactpersoon" checked={fields.opdrachtgever_contact !== false} onChange={v => setField('opdrachtgever_contact', v)} />
          <FieldToggle label="E-mail" checked={fields.opdrachtgever_email === true} onChange={v => setField('opdrachtgever_email', v)} />
          <FieldToggle label="Telefoon" checked={fields.opdrachtgever_telefoon === true} onChange={v => setField('opdrachtgever_telefoon', v)} />
        </div>

        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Monteur</p>
          <FieldToggle label="Naam" checked={fields.monteur_naam !== false} onChange={v => setField('monteur_naam', v)} />
          <FieldToggle label="Medewerkernummer" checked={fields.monteur_code === true} onChange={v => setField('monteur_code', v)} />
        </div>

        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Meetapparatuur</p>
          <FieldToggle label="Apparaat" checked={fields.apparaat_naam !== false} onChange={v => setField('apparaat_naam', v)} />
          <FieldToggle label="Merk" checked={fields.apparaat_merk !== false} onChange={v => setField('apparaat_merk', v)} />
          <FieldToggle label="Model" checked={fields.apparaat_model !== false} onChange={v => setField('apparaat_model', v)} />
          <FieldToggle label="Serienummer" checked={fields.apparaat_serienummer !== false} onChange={v => setField('apparaat_serienummer', v)} />
          <FieldToggle label="Kalibratiedatum" checked={fields.apparaat_kalibratie !== false} onChange={v => setField('apparaat_kalibratie', v)} />
          <FieldToggle label="Volgende kalibratie" checked={fields.apparaat_volgende_kalibratie !== false} onChange={v => setField('apparaat_volgende_kalibratie', v)} />
        </div>
      </div>

      <Separator />

      {/* Measurement table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Meettabel</h3>
        <SectionToggle label="Pennen naast elkaar" checked={form.report_pens_side_by_side !== false} onChange={v => updateField('report_pens_side_by_side', v)} />
        <SectionToggle label="Foto-bijschriften" checked={form.report_captions !== false} onChange={v => updateField('report_captions', v)} />
        <div>
          <Label className="text-xs text-muted-foreground">Lege cellen weergeven als</Label>
          <Select value={form.report_empty_cell || '—'} onValueChange={v => updateField('report_empty_cell', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="—">Streepje (—)</SelectItem>
              <SelectItem value="">Leeg</SelectItem>
              <SelectItem value="-">Minteken (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Decimalen</Label>
          <Select value={form.report_decimals || 'auto'} onValueChange={v => updateField('report_decimals', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automatisch</SelectItem>
              <SelectItem value="1">1 decimaal</SelectItem>
              <SelectItem value="2">2 decimalen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Signing block */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Ondertekening</h3>
        <SectionToggle label="Ondertekenblok tonen" checked={form.report_sign_block === true} onChange={v => updateField('report_sign_block', v)} />
        {form.report_sign_block && (
          <div className="pl-2 space-y-1 border-l-2 border-border">
            <FieldToggle label="Naam uitvoerder" checked={form.report_sign_executor !== false} onChange={v => updateField('report_sign_executor', v)} />
            <FieldToggle label="Naam controleur" checked={form.report_sign_reviewer === true} onChange={v => updateField('report_sign_reviewer', v)} />
            <FieldToggle label="Datum ondertekening" checked={form.report_sign_date !== false} onChange={v => updateField('report_sign_date', v)} />
          </div>
        )}
        <div>
          <Label className="text-xs text-muted-foreground">Disclaimertekst (optioneel)</Label>
          <Textarea value={form.report_disclaimer || ''} onChange={e => updateField('report_disclaimer', e.target.value)}
            placeholder="Eventuele disclaimer of voorwaarden..." className="mt-1 text-xs" rows={3} />
        </div>
      </div>
    </div>
  );
}
