import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BrandTabExportProps {
  form: Record<string, any>;
  updateField: (key: string, value: any) => void;
}

export function BrandTabExport({ form, updateField }: BrandTabExportProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Bestandsnaam</h3>
        <div>
          <Label className="text-xs text-muted-foreground">PDF bestandsnaam patroon</Label>
          <Input value={form.export_filename_pattern || ''} onChange={e => updateField('export_filename_pattern', e.target.value)}
            placeholder="Aardingsrapport_[projectnummer]_[datum]" className="mt-1 font-mono text-xs" />
          <p className="text-[10px] text-muted-foreground mt-1">
            Beschikbare variabelen: [projectnummer], [projectnaam], [datum], [opdrachtgever]
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Datumweergave in bestandsnaam</Label>
          <Select value={form.export_date_format || 'dd-MM-yyyy'} onValueChange={v => updateField('export_date_format', v)}>
            <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dd-MM-yyyy">dd-MM-yyyy</SelectItem>
              <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
              <SelectItem value="ddMMyyyy">ddMMyyyy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Printprofiel</h3>
        <Select value={form.export_print_profile || 'a4_standard'} onValueChange={v => updateField('export_print_profile', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a4_standard">A4 Standaard</SelectItem>
            <SelectItem value="a4_compact">A4 Compact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border overflow-hidden">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-3 py-2 bg-muted/50">Voorbeeld bestandsnaam</p>
        <div className="px-4 py-3 bg-white">
          <p className="text-sm font-mono text-foreground">
            {(form.export_filename_pattern || 'Aardingsrapport_[projectnummer]_[datum]')
              .replace('[projectnummer]', 'P-2025-042')
              .replace('[projectnaam]', 'Schiphol Terminal')
              .replace('[datum]', '20-03-2026')
              .replace('[opdrachtgever]', 'KlantBV')
            }.pdf
          </p>
        </div>
      </div>
    </div>
  );
}
