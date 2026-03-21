import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/contexts/TenantContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BrandTabMerk } from '@/components/settings/BrandTabMerk';
import { BrandTabApp } from '@/components/settings/BrandTabApp';
import { BrandTabRapport } from '@/components/settings/BrandTabRapport';
import { BrandTabBedrijf } from '@/components/settings/BrandTabBedrijf';
import { BrandTabExport } from '@/components/settings/BrandTabExport';
import { Palette, Monitor, FileText, Building2, Download, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUB_TABS = [
  { key: 'merk', label: 'Merk' },
  { key: 'app', label: 'App' },
  { key: 'rapport', label: 'Rapport' },
  { key: 'bedrijf', label: 'Bedrijf' },
  { key: 'export', label: 'Export' },
];

export default function BrandingSettings() {
  const { tenant, branding, refetchBranding } = useTenant();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [activeSubTab, setActiveSubTab] = useState('merk');

  useEffect(() => {
    if (branding) {
      setForm({ ...branding });
    } else {
      setForm({
        primary_color: '#1e40af',
        secondary_color: '#64748b',
        accent_color: '#0ea5e9',
        logo_url: '',
        compact_logo_url: '',
        dark_logo_url: '',
        light_logo_url: '',
        official_company_name: '',
        border_radius: 'medium',
        interface_density: 'standard',
        report_title: 'Aardingsmeting Rapport',
        report_subtitle: '',
        report_show_logo: true,
        report_logo_size: 'medium',
        report_density: 'standard',
        report_page_numbers: true,
        report_header_every_page: false,
        report_footer_every_page: true,
        report_table_style: 'standard',
        report_photo_grouping: 'electrode',
        report_sections: {
          projectgegevens: true, opdrachtgever: true, monteur: true, meetapparatuur: true,
          meetresultaten: true, fotos: true, schets: true, notities: true, ondertekening: false, bijlagen: true,
        },
        report_fields: {
          projectnummer: true, projectnaam: true, adres: true, meetdatum: true, werkordernummer: false,
          opdrachtgever_bedrijf: true, opdrachtgever_contact: true, opdrachtgever_email: false, opdrachtgever_telefoon: false,
          monteur_naam: true, monteur_code: false,
          apparaat_naam: true, apparaat_merk: true, apparaat_model: true, apparaat_serienummer: true,
          apparaat_kalibratie: true, apparaat_volgende_kalibratie: true,
        },
        report_pens_side_by_side: true,
        report_empty_cell: '—',
        report_decimals: 'auto',
        report_captions: true,
        report_sign_block: false,
        report_sign_executor: true,
        report_sign_reviewer: false,
        report_sign_date: true,
        report_disclaimer: '',
        footer_company_name: '',
        footer_address: '',
        footer_postal_code: '',
        footer_city: '',
        footer_country: '',
        footer_email: '',
        footer_phone: '',
        footer_website: '',
        kvk_number: '',
        btw_number: '',
        export_filename_pattern: 'Aardingsrapport_[projectnummer]_[datum]',
        export_date_format: 'dd-MM-yyyy',
        export_print_profile: 'a4_standard',
      });
    }
  }, [branding]);

  const updateField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const textNullable = [
      'logo_url', 'compact_logo_url', 'dark_logo_url', 'light_logo_url',
      'official_company_name', 'report_subtitle', 'report_header_color', 'report_footer_color',
      'report_disclaimer',
      'footer_company_name', 'footer_address', 'footer_postal_code', 'footer_city', 'footer_country',
      'footer_email', 'footer_phone', 'footer_website',
      'support_email', 'support_phone', 'website',
      'kvk_number', 'btw_number',
    ];

    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(form)) {
      if (k === 'id' || k === 'tenant_id' || k === 'created_at' || k === 'updated_at') continue;
      if (textNullable.includes(k)) {
        payload[k] = v || null;
      } else {
        payload[k] = v;
      }
    }

    if (branding) {
      const { error } = await supabase.from('tenant_branding').update(payload).eq('tenant_id', tenant.id);
      if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Instellingen opgeslagen' }); await refetchBranding(); }
    } else {
      const { error } = await supabase.from('tenant_branding').insert({ ...payload, tenant_id: tenant.id });
      if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Instellingen aangemaakt' }); await refetchBranding(); }
    }
    setSaving(false);
  };

  if (isMobile) {
    return (
      <div className="ios-settings-page animate-fade-in">
        {/* Sticky top nav */}
        <div className="ios-settings-topnav">
          <button onClick={() => navigate('/meer')} className="ios-settings-nav-back">
            <ChevronLeft className="h-5 w-5" style={{ color: 'hsl(var(--tenant-primary))' }} />
            <span>Meer</span>
          </button>
          <span className="ios-settings-nav-title">Huisstijl</span>
          <button onClick={handleSave} disabled={saving} className="ios-settings-nav-save">
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

        {/* Sub tabs — segmented control */}
        <div className="ios-settings-sub-tabs">
          {SUB_TABS.map(t => (
            <button
              key={t.key}
              className={cn('ios-settings-sub-tab', activeSubTab === t.key && 'active')}
              onClick={() => setActiveSubTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ios-settings-scroll">
          {activeSubTab === 'merk' && <BrandTabMerk form={form} updateField={updateField} tenantId={tenant?.id || ''} />}
          {activeSubTab === 'app' && <BrandTabApp form={form} updateField={updateField} />}
          {activeSubTab === 'rapport' && <BrandTabRapport form={form} updateField={updateField} />}
          {activeSubTab === 'bedrijf' && <BrandTabBedrijf form={form} updateField={updateField} />}
          {activeSubTab === 'export' && <BrandTabExport form={form} updateField={updateField} />}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Huisstijl & Rapportinstellingen"
        description="Pas uw merkidentiteit, interface en rapportuitvoer aan"
        action={<Button onClick={handleSave} disabled={saving}>{saving ? 'Opslaan...' : 'Opslaan'}</Button>}
      />

      <Tabs defaultValue="merk" className="mt-4">
        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
          <TabsTrigger value="merk" className="text-xs gap-1 py-2">
            <Palette className="h-3.5 w-3.5 hidden sm:block" /> Merk
          </TabsTrigger>
          <TabsTrigger value="app" className="text-xs gap-1 py-2">
            <Monitor className="h-3.5 w-3.5 hidden sm:block" /> App
          </TabsTrigger>
          <TabsTrigger value="rapport" className="text-xs gap-1 py-2">
            <FileText className="h-3.5 w-3.5 hidden sm:block" /> Rapport
          </TabsTrigger>
          <TabsTrigger value="bedrijf" className="text-xs gap-1 py-2">
            <Building2 className="h-3.5 w-3.5 hidden sm:block" /> Bedrijf
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs gap-1 py-2">
            <Download className="h-3.5 w-3.5 hidden sm:block" /> Export
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card rounded-lg border border-border p-4 sm:p-6">
          <TabsContent value="merk" className="mt-0">
            <BrandTabMerk form={form} updateField={updateField} tenantId={tenant?.id || ''} />
          </TabsContent>
          <TabsContent value="app" className="mt-0">
            <BrandTabApp form={form} updateField={updateField} />
          </TabsContent>
          <TabsContent value="rapport" className="mt-0">
            <BrandTabRapport form={form} updateField={updateField} />
          </TabsContent>
          <TabsContent value="bedrijf" className="mt-0">
            <BrandTabBedrijf form={form} updateField={updateField} />
          </TabsContent>
          <TabsContent value="export" className="mt-0">
            <BrandTabExport form={form} updateField={updateField} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
