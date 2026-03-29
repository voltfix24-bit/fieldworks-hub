import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BrandTabBedrijfProps {
  form: Record<string, any>;
  updateField: (key: string, value: any) => void;
}

export function BrandTabBedrijf({ form, updateField }: BrandTabBedrijfProps) {
  const fieldGroups = [
    {
      title: 'Adresgegevens',
      fields: [
        { key: 'footer_company_name', label: 'Bedrijfsnaam', placeholder: 'Bedrijf BV' },
        { key: 'footer_address', label: 'Adres', placeholder: 'Straat 123' },
        { key: 'footer_postal_code', label: 'Postcode', placeholder: '1234 AB' },
        { key: 'footer_city', label: 'Plaats', placeholder: 'Amsterdam' },
        { key: 'footer_country', label: 'Land', placeholder: 'Nederland' },
      ],
    },
    {
      title: 'Contactgegevens',
      fields: [
        { key: 'footer_phone', label: 'Telefoon', placeholder: '+31 20 123 4567' },
        { key: 'footer_email', label: 'E-mail', placeholder: 'info@bedrijf.nl' },
        { key: 'footer_website', label: 'Website', placeholder: 'https://bedrijf.nl' },
      ],
    },
    {
      title: 'Registratie & Certificering',
      fields: [
        { key: 'kvk_number', label: 'KvK-nummer', placeholder: '12345678' },
        { key: 'btw_number', label: 'BTW-nummer', placeholder: 'NL123456789B01' },
        { key: 'certificaten', label: 'Certificaten', placeholder: 'VCA** gecertificeerd · ISO 9001:2015' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {fieldGroups.map(group => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
          {group.fields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input value={form[key] || ''} onChange={e => updateField(key, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      ))}

      {/* Preview footer */}
      <div className="rounded-lg border border-border overflow-hidden">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-3 py-2 bg-muted/50">Voorbeeld rapportvoettekst</p>
        <div className="px-4 py-3 bg-white">
          <p className="text-[10px] font-semibold text-foreground">{form.footer_company_name || 'Bedrijfsnaam'}</p>
          <p className="text-[9px] text-muted-foreground">
            {[form.footer_address, form.footer_postal_code, form.footer_city, form.footer_country].filter(Boolean).join(', ') || 'Adres'}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {[form.footer_email, form.footer_phone, form.footer_website].filter(Boolean).join('  ·  ') || 'Contactgegevens'}
          </p>
          {(form.kvk_number || form.btw_number) && (
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {[form.kvk_number && `KvK: ${form.kvk_number}`, form.btw_number && `BTW: ${form.btw_number}`].filter(Boolean).join('  ·  ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
