import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, Trash2, Loader2, Sparkles } from 'lucide-react';

interface LogoFieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  tenantId: string;
  storagePath: string;
  /** If true, show as derived/auto-filled */
  isDerived?: boolean;
}

function LogoField({ label, hint, value, onChange, tenantId, storagePath, isDerived }: LogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Bestand te groot', description: 'Maximaal 10MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const safeTenantId = tenantId || 'algemeen';
      const path = `${safeTenantId}/${storagePath}_${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('tenant-assets').upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('tenant-assets').getPublicUrl(path);
      onChange(publicUrl);
      toast({ title: 'Logo geüpload' });
    } catch (error: any) {
      toast({ title: 'Upload mislukt', description: error?.message || 'Onbekende fout bij uploaden.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <img src={value} alt={label} className="h-14 w-14 rounded-lg object-contain border border-border bg-white" />
      ) : (
        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {isDerived && value && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] text-[hsl(var(--tenant-primary,var(--primary))/0.6)] font-medium">
              Auto
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <div className="flex gap-2 mt-1.5">
          <Label htmlFor={`logo-${storagePath}`}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-xs font-medium transition-colors">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? 'Uploaden...' : isDerived && !value ? 'Eigen uploaden' : 'Uploaden'}
          </Label>
          {value && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => onChange('')}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <input ref={inputRef} id={`logo-${storagePath}`} type="file" accept="image/*,.svg" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
}

interface BrandTabMerkProps {
  form: Record<string, any>;
  updateField: (key: string, value: any) => void;
  tenantId: string;
}

export function BrandTabMerk({ form, updateField, tenantId }: BrandTabMerkProps) {
  /** When main logo changes, auto-fill empty variant slots */
  const handleMainLogoChange = (url: string) => {
    updateField('logo_url', url);
    if (url) {
      // Auto-fill other logo fields if they are empty
      if (!form.compact_logo_url) updateField('compact_logo_url', url);
      if (!form.dark_logo_url) updateField('dark_logo_url', url);
      if (!form.light_logo_url) updateField('light_logo_url', url);
    }
  };

  /** Check if a variant is using the main logo (auto-derived) */
  const isDerived = (field: string) => {
    return form[field] === form.logo_url && !!form.logo_url;
  };

  return (
    <div className="space-y-6">
      {/* Company names */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Bedrijfsnaam</h3>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Korte bedrijfsnaam</Label>
            <Input value={form.footer_company_name || ''} onChange={e => updateField('footer_company_name', e.target.value)} placeholder="Bedrijf BV" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Officiële bedrijfsnaam (optioneel)</Label>
            <Input value={form.official_company_name || ''} onChange={e => updateField('official_company_name', e.target.value)} placeholder="Bedrijf Technische Diensten B.V." className="mt-1" />
          </div>
        </div>
      </div>

      {/* Logos */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Logo's</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload je hoofdlogo — de andere varianten worden automatisch ingevuld.
          </p>
        </div>

        <div className="space-y-4">
          <LogoField
            label="Hoofdlogo"
            hint="Gebruikt in rapport en app — vult overige automatisch in"
            value={form.logo_url || ''}
            onChange={handleMainLogoChange}
            tenantId={tenantId}
            storagePath="logo"
          />

          {/* Show variant fields only after main logo is set, or if they have custom values */}
          {(form.logo_url || form.compact_logo_url || form.dark_logo_url || form.light_logo_url) && (
            <div className="space-y-3 pl-3 border-l-2 border-border/40">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50">
                Varianten — optioneel aanpasbaar
              </p>
              <LogoField
                label="Compact logo / icoon"
                hint="Mobiele header en kleine weergaves"
                value={form.compact_logo_url || ''}
                onChange={v => updateField('compact_logo_url', v)}
                tenantId={tenantId}
                storagePath="compact_logo"
                isDerived={isDerived('compact_logo_url')}
              />
              <LogoField
                label="Donkere variant"
                hint="Voor donkere achtergronden"
                value={form.dark_logo_url || ''}
                onChange={v => updateField('dark_logo_url', v)}
                tenantId={tenantId}
                storagePath="dark_logo"
                isDerived={isDerived('dark_logo_url')}
              />
              <LogoField
                label="Lichte variant"
                hint="Voor lichte achtergronden"
                value={form.light_logo_url || ''}
                onChange={v => updateField('light_logo_url', v)}
                tenantId={tenantId}
                storagePath="light_logo"
                isDerived={isDerived('light_logo_url')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {(form.logo_url || form.footer_company_name) && (
        <div className="rounded-lg border border-border overflow-hidden">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-3 py-2 bg-muted/50">Voorbeeld</p>
          <div className="p-4 bg-white flex items-center gap-3">
            {form.logo_url && <img src={form.logo_url} alt="" className="h-10 w-auto max-w-[120px] object-contain" />}
            <span className="text-sm font-semibold text-foreground">{form.footer_company_name || 'Bedrijfsnaam'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
