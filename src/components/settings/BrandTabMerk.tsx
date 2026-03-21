import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, Trash2, Loader2, Sparkles, RefreshCw, Check, AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Logo upload field                                                  */
/* ------------------------------------------------------------------ */
interface LogoFieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  tenantId: string;
  storagePath: string;
  isDerived?: boolean;
  /** AI generation state */
  genState?: 'idle' | 'generating' | 'generated' | 'error';
  genError?: string;
  onRegenerate?: () => void;
  onKeep?: () => void;
}

function LogoField({
  label, hint, value, onChange, tenantId, storagePath,
  isDerived, genState = 'idle', genError, onRegenerate, onKeep,
}: LogoFieldProps) {
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
      toast({ title: 'Upload mislukt', description: error?.message || 'Onbekende fout.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isGenerating = genState === 'generating';
  const isGenerated = genState === 'generated';
  const isError = genState === 'error';

  return (
    <div className="flex items-start gap-3">
      {/* Preview */}
      <div className="relative shrink-0">
        {value ? (
          <div className={`h-14 w-14 rounded-xl border bg-white flex items-center justify-center overflow-hidden transition-all ${isGenerated ? 'border-primary/30 ring-2 ring-primary/10' : 'border-border'}`}>
            <img src={value} alt={label} className="h-12 w-12 object-contain" />
          </div>
        ) : isGenerating ? (
          <div className="h-14 w-14 rounded-xl bg-muted/60 border border-border flex items-center justify-center animate-pulse">
            <Sparkles className="h-5 w-5 text-primary/40 animate-spin" />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
        {/* Generated badge */}
        {isGenerated && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {isGenerated && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary/70 font-medium">
              AI gegenereerd
            </span>
          )}
          {isDerived && !isGenerated && value && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              Kopie
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>{genError || 'Genereren niet mogelijk voor dit logo'}</span>
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Variant wordt gegenereerd…</span>
          </div>
        )}

        {/* Actions */}
        {!isGenerating && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* Generated: show keep / replace / regenerate */}
            {isGenerated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1 border-primary/20 text-primary hover:bg-primary/5"
                  onClick={onKeep}
                >
                  <Check className="h-3 w-3" /> Behouden
                </Button>
                <Label
                  htmlFor={`logo-${storagePath}`}
                  className="cursor-pointer inline-flex items-center gap-1 px-2.5 h-7 bg-muted/60 hover:bg-muted rounded-md text-xs font-medium transition-colors"
                >
                  <Upload className="h-3 w-3" /> Vervangen
                </Label>
                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-3 w-3" /> Opnieuw
                  </Button>
                )}
              </>
            )}

            {/* Error: show upload + regenerate */}
            {isError && (
              <>
                <Label
                  htmlFor={`logo-${storagePath}`}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-7 bg-muted/60 hover:bg-muted rounded-md text-xs font-medium transition-colors"
                >
                  <Upload className="h-3 w-3" /> Handmatig uploaden
                </Label>
                {onRegenerate && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-muted-foreground" onClick={onRegenerate}>
                    <RefreshCw className="h-3 w-3" /> Opnieuw proberen
                  </Button>
                )}
              </>
            )}

            {/* Normal idle state */}
            {!isGenerated && !isError && (
              <>
                <Label
                  htmlFor={`logo-${storagePath}`}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-7 bg-muted/60 hover:bg-muted rounded-md text-xs font-medium transition-colors"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {uploading ? 'Uploaden...' : 'Uploaden'}
                </Label>
                {value && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => onChange('')}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        <input ref={inputRef} id={`logo-${storagePath}`} type="file" accept="image/*,.svg" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
type VariantKey = 'compact' | 'dark' | 'light';
type GenState = 'idle' | 'generating' | 'generated' | 'error';

interface VariantStatus {
  state: GenState;
  error?: string;
}

interface BrandTabMerkProps {
  form: Record<string, any>;
  updateField: (key: string, value: any) => void;
  tenantId: string;
}

const VARIANT_CONFIG: Record<VariantKey, { field: string; storagePath: string; label: string; hint: string }> = {
  compact: { field: 'compact_logo_url', storagePath: 'compact_logo', label: 'Compact logo / icoon', hint: 'Mobiele header en kleine weergaves' },
  dark: { field: 'dark_logo_url', storagePath: 'dark_logo', label: 'Donkere variant', hint: 'Voor donkere achtergronden' },
  light: { field: 'light_logo_url', storagePath: 'light_logo', label: 'Lichte variant', hint: 'Voor lichte achtergronden' },
};

export function BrandTabMerk({ form, updateField, tenantId }: BrandTabMerkProps) {
  const { toast } = useToast();
  const [variantStatus, setVariantStatus] = useState<Record<VariantKey, VariantStatus>>({
    compact: { state: 'idle' },
    dark: { state: 'idle' },
    light: { state: 'idle' },
  });

  const generateVariant = useCallback(async (variant: VariantKey, logoUrl: string) => {
    setVariantStatus(prev => ({ ...prev, [variant]: { state: 'generating' } }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-logo-variants', {
        body: { logoUrl, tenantId, variant },
      });

      if (error) throw error;
      if (data?.error || data?.unsupported) {
        setVariantStatus(prev => ({
          ...prev,
          [variant]: { state: 'error', error: data?.error || 'Niet geschikt voor automatisch genereren' },
        }));
        return;
      }

      const cfg = VARIANT_CONFIG[variant];
      updateField(cfg.field, data.url);
      setVariantStatus(prev => ({ ...prev, [variant]: { state: 'generated' } }));
    } catch (err: any) {
      console.error(`Failed to generate ${variant}:`, err);
      setVariantStatus(prev => ({
        ...prev,
        [variant]: { state: 'error', error: 'Genereren mislukt — probeer het opnieuw of upload handmatig' },
      }));
    }
  }, [tenantId, updateField]);

  const generateAllVariants = useCallback(async (logoUrl: string) => {
    const variants: VariantKey[] = ['compact', 'dark', 'light'];
    // Generate sequentially to avoid rate limits, but start all with generating state
    for (const v of variants) {
      await generateVariant(v, logoUrl);
    }
  }, [generateVariant]);

  const handleMainLogoChange = async (url: string) => {
    updateField('logo_url', url);
    if (url) {
      // Clear old variants when new main logo is set
      updateField('compact_logo_url', '');
      updateField('dark_logo_url', '');
      updateField('light_logo_url', '');
      setVariantStatus({
        compact: { state: 'idle' },
        dark: { state: 'idle' },
        light: { state: 'idle' },
      });
      // Start AI generation
      toast({ title: 'Logo-varianten worden gegenereerd', description: 'Even geduld — AI maakt de varianten aan.' });
      await generateAllVariants(url);
    }
  };

  const handleKeep = (variant: VariantKey) => {
    setVariantStatus(prev => ({ ...prev, [variant]: { state: 'idle' } }));
    toast({ title: `${VARIANT_CONFIG[variant].label} bewaard` });
  };

  const handleRegenerate = (variant: VariantKey) => {
    if (form.logo_url) {
      generateVariant(variant, form.logo_url);
    }
  };

  const handleVariantChange = (variant: VariantKey, url: string) => {
    updateField(VARIANT_CONFIG[variant].field, url);
    // If manually uploaded, clear generated state
    if (url) {
      setVariantStatus(prev => ({ ...prev, [variant]: { state: 'idle' } }));
    }
  };

  const anyGenerating = Object.values(variantStatus).some(s => s.state === 'generating');

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
            Upload je hoofdlogo — varianten worden automatisch gegenereerd met AI.
          </p>
        </div>

        <div className="space-y-4">
          <LogoField
            label="Hoofdlogo"
            hint="Gebruikt in rapport en app — genereert automatisch varianten"
            value={form.logo_url || ''}
            onChange={handleMainLogoChange}
            tenantId={tenantId}
            storagePath="logo"
          />

          {/* Variants section */}
          {(form.logo_url || form.compact_logo_url || form.dark_logo_url || form.light_logo_url) && (
            <div className="space-y-3 pl-3 border-l-2 border-border/40">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50">
                  {anyGenerating ? 'Varianten genereren…' : 'Varianten — AI gegenereerd of handmatig'}
                </p>
                {form.logo_url && !anyGenerating && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1 text-muted-foreground"
                    onClick={() => generateAllVariants(form.logo_url)}
                  >
                    <Sparkles className="h-3 w-3" /> Alles opnieuw genereren
                  </Button>
                )}
              </div>

              {(['compact', 'dark', 'light'] as VariantKey[]).map(variant => {
                const cfg = VARIANT_CONFIG[variant];
                const status = variantStatus[variant];
                return (
                  <LogoField
                    key={variant}
                    label={cfg.label}
                    hint={cfg.hint}
                    value={form[cfg.field] || ''}
                    onChange={(v) => handleVariantChange(variant, v)}
                    tenantId={tenantId}
                    storagePath={cfg.storagePath}
                    genState={status.state}
                    genError={status.error}
                    onRegenerate={() => handleRegenerate(variant)}
                    onKeep={() => handleKeep(variant)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {(form.logo_url || form.footer_company_name) && (
        <div className="rounded-xl border border-border overflow-hidden">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-3 py-2 bg-muted/30">Voorbeeld</p>
          <div className="grid grid-cols-2 divide-x divide-border">
            {/* Light preview */}
            <div className="p-4 bg-white flex flex-col items-center gap-2">
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Licht</span>
              {(form.light_logo_url || form.logo_url) && (
                <img src={form.light_logo_url || form.logo_url} alt="" className="h-8 w-auto max-w-[100px] object-contain" />
              )}
              <span className="text-xs font-medium text-gray-900">{form.footer_company_name || 'Bedrijfsnaam'}</span>
            </div>
            {/* Dark preview */}
            <div className="p-4 bg-gray-900 flex flex-col items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Donker</span>
              {(form.dark_logo_url || form.logo_url) && (
                <img src={form.dark_logo_url || form.logo_url} alt="" className="h-8 w-auto max-w-[100px] object-contain" />
              )}
              <span className="text-xs font-medium text-gray-100">{form.footer_company_name || 'Bedrijfsnaam'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
