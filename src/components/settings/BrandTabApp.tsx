import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface BrandTabAppProps {
  form: Record<string, any>;
  updateField: (key: string, value: any) => void;
}

export function BrandTabApp({ form, updateField }: BrandTabAppProps) {
  return (
    <div className="space-y-6">
      {/* Colors */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Kleuren</h3>
        {[
          { key: 'primary_color', label: 'Primaire kleur', hint: 'Knoppen, actieve elementen, navigatie' },
          { key: 'secondary_color', label: 'Secundaire kleur', hint: 'Secundaire accenten en achtergronden' },
          { key: 'accent_color', label: 'Accentkleur', hint: 'Subtiele highlights en ondersteunende elementen' },
        ].map(({ key, label, hint }) => (
          <div key={key} className="flex items-center gap-3">
            <input type="color" value={form[key] || '#000000'} onChange={e => updateField(key, e.target.value)}
              className="h-9 w-9 rounded-md border border-border cursor-pointer shrink-0" />
            <div className="flex-1">
              <Label className="text-xs font-medium">{label}</Label>
              <p className="text-[10px] text-muted-foreground">{hint}</p>
              <Input value={form[key] || ''} onChange={e => updateField(key, e.target.value)} className="mt-1 h-8 text-xs font-mono" placeholder="#000000" />
            </div>
          </div>
        ))}
      </div>

      {/* Border radius */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Hoekafronding</h3>
        <Select value={form.border_radius || 'medium'} onValueChange={v => updateField('border_radius', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Scherp (0px)</SelectItem>
            <SelectItem value="small">Subtiel (4px)</SelectItem>
            <SelectItem value="medium">Standaard (8px)</SelectItem>
            <SelectItem value="large">Afgerond (12px)</SelectItem>
            <SelectItem value="full">Volledig rond (16px)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Density */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Interface dichtheid</h3>
        <Select value={form.interface_density || 'standard'} onValueChange={v => updateField('interface_density', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="standard">Standaard</SelectItem>
            <SelectItem value="spacious">Ruim</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Button preview */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Voorbeeld knoppen</p>
        <div className="flex flex-wrap gap-2 p-4 rounded-lg border border-border bg-muted/20">
          <button className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors" style={{ backgroundColor: form.primary_color || '#1e40af' }}>
            Primair
          </button>
          <button className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors" style={{ backgroundColor: form.secondary_color || '#64748b' }}>
            Secundair
          </button>
          <button className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors" style={{ backgroundColor: form.accent_color || '#0ea5e9' }}>
            Accent
          </button>
        </div>
      </div>
    </div>
  );
}
