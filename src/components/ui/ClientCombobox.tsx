import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, ChevronDown, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateClient } from '@/hooks/use-clients';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientComboboxProps {
  value: string;
  onChange: (id: string) => void;
  clients: Client[];
  onClientAangemaakt?: (client: Client) => void;
  compact?: boolean;
}

function markeerMatch(tekst: string, zoek: string) {
  if (!zoek) return tekst;
  const regex = new RegExp(
    `(${zoek.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  const parts = tekst.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part
  );
}

export function ClientCombobox({ value, onChange, clients, onClientAangemaakt, compact }: ClientComboboxProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const createClient = useCreateClient();

  const [zoekterm, setZoekterm] = useState('');
  const [open, setOpen] = useState(false);
  const [toonAanmaakSheet, setToonAanmaakSheet] = useState(false);
  const [aanmakende, setAanmakende] = useState(false);
  const [nieuwForm, setNieuwForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    address_line_1: '', postal_code: '', city: '',
  });
  const [showAdres, setShowAdres] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const geselecteerd = clients.find(c => c.id === value);

  const gefilterd = zoekterm.trim()
    ? clients.filter(c =>
        c.company_name.toLowerCase().includes(zoekterm.toLowerCase())
      ).slice(0, 5)
    : clients.slice(0, 5);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAanmaken = async () => {
    if (!nieuwForm.company_name.trim() || !profile?.tenant_id) return;
    setAanmakende(true);
    try {
      const nieuwKlant = await createClient.mutateAsync({
        tenant_id: profile.tenant_id,
        company_name: nieuwForm.company_name,
        contact_name: nieuwForm.contact_name || null,
        email: nieuwForm.email || null,
        phone: nieuwForm.phone || null,
        address_line_1: nieuwForm.address_line_1 || null,
        postal_code: nieuwForm.postal_code || null,
        city: nieuwForm.city || null,
        is_active: true,
      });
      onChange(nieuwKlant.id);
      onClientAangemaakt?.(nieuwKlant as Client);
      setToonAanmaakSheet(false);
      setZoekterm('');
      setOpen(false);
      toast({ title: 'Klant aangemaakt', description: `${nieuwForm.company_name} is toegevoegd en geselecteerd.` });
    } catch (err) {
      toast({ title: 'Aanmaken mislukt', description: err instanceof Error ? err.message : 'Probeer opnieuw', variant: 'destructive' });
    } finally {
      setAanmakende(false);
    }
  };

  const openAanmaakSheet = () => {
    setNieuwForm({
      company_name: zoekterm, contact_name: '', email: '', phone: '',
      address_line_1: '', postal_code: '', city: '',
    });
    setShowAdres(false);
    setOpen(false);
    setToonAanmaakSheet(true);
  };

  // Selected state
  if (geselecteerd && !open) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-6 w-6 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary))/0.1)] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[hsl(var(--tenant-primary,var(--primary)))]">
              {geselecteerd.company_name[0].toUpperCase()}
            </span>
          </div>
          <span className="text-[13px] font-medium text-foreground truncate">
            {geselecteerd.company_name}
          </span>
        </div>
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="h-6 w-6 rounded-full bg-foreground/6 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
        >
          <X className="h-3 w-3 text-muted-foreground/60" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div ref={wrapRef} className="relative">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={zoekterm}
            onChange={e => { setZoekterm(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Zoek of typ bedrijfsnaam…"
            className={cn(
              "w-full pl-8 pr-3 py-2 rounded-xl text-[13px]",
              "bg-foreground/[0.03] border border-border/30",
              "placeholder:text-muted-foreground/30",
              "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--tenant-primary,var(--primary))/0.2)] focus:border-[hsl(var(--tenant-primary,var(--primary))/0.3)]",
              "transition-all"
            )}
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1.5 rounded-2xl bg-popover border border-border/30 shadow-lg overflow-hidden max-h-[260px] overflow-y-auto">
            {gefilterd.length > 0 ? (
              gefilterd.map(client => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => { onChange(client.id); setZoekterm(''); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/[0.03] active:bg-foreground/[0.05] transition-colors border-b border-border/10 last:border-0"
                >
                  <div className="h-8 w-8 rounded-xl bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[hsl(var(--tenant-primary,var(--primary)))]">
                      {client.company_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-muted-foreground truncate">
                      {markeerMatch(client.company_name, zoekterm)}
                    </p>
                    {client.contact_name && (
                      <p className="text-[11px] text-muted-foreground/40 truncate">{client.contact_name}</p>
                    )}
                  </div>
                </button>
              ))
            ) : zoekterm.trim() ? (
              <div className="p-3 space-y-2">
                <p className="text-[12px] text-muted-foreground/50 text-center">
                  "{zoekterm}" niet gevonden
                </p>
                <button
                  type="button"
                  onClick={openAanmaakSheet}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] text-[hsl(var(--tenant-primary,var(--primary)))] text-[13px] font-semibold active:scale-[0.98] transition-all justify-center"
                >
                  <Plus className="h-4 w-4" />
                  "{zoekterm}" aanmaken als nieuwe klant
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-[12px] text-muted-foreground/40">
                Typ om te zoeken
              </div>
            )}

            {/* Always show create option at bottom when there are results */}
            {gefilterd.length > 0 && zoekterm.trim() && (
              <button
                type="button"
                onClick={openAanmaakSheet}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium text-[hsl(var(--tenant-primary,var(--primary)))] hover:bg-foreground/[0.02] transition-colors border-t border-border/10 justify-center"
              >
                <Plus className="h-3.5 w-3.5" />
                Nieuwe klant aanmaken
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Aanmaak Sheet ─── */}
      {toonAanmaakSheet && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setToonAanmaakSheet(false)}
          />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl"
            style={{ animation: 'slide-up 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-[5px] rounded-full bg-foreground/10" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-3">
              <div>
                <h3 className="text-[17px] font-bold text-foreground tracking-tight">Nieuwe klant</h3>
                <p className="text-[13px] text-muted-foreground/50 mt-0.5">Minimale gegevens — later aan te vullen</p>
              </div>
              <button
                type="button"
                onClick={() => setToonAanmaakSheet(false)}
                className="w-8 h-8 rounded-full bg-foreground/6 flex items-center justify-center mt-0.5"
              >
                <X className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </div>

            {/* Form */}
            <div className="px-5 pb-2 space-y-0 max-h-[60vh] overflow-y-auto">
              <div className="ios-form-card">
                {/* Bedrijfsnaam */}
                <div className="ios-form-field ios-form-field-full">
                  <span className="ios-form-field-label">Bedrijfsnaam *</span>
                  <input
                    className="ios-form-input"
                    value={nieuwForm.company_name}
                    onChange={e => setNieuwForm(p => ({ ...p, company_name: e.target.value }))}
                    autoFocus
                    placeholder="Naam van het bedrijf"
                  />
                </div>

                <div className="ios-form-divider" />

                {/* Contactpersoon */}
                <div className="ios-form-field ios-form-field-full">
                  <span className="ios-form-field-label">Contactpersoon</span>
                  <input
                    className="ios-form-input"
                    value={nieuwForm.contact_name}
                    onChange={e => setNieuwForm(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Naam contactpersoon"
                  />
                </div>

                <div className="ios-form-divider" />

                {/* E-mail */}
                <div className="ios-form-field ios-form-field-full">
                  <span className="ios-form-field-label">E-mail</span>
                  <input
                    className="ios-form-input"
                    type="email"
                    inputMode="email"
                    value={nieuwForm.email}
                    onChange={e => setNieuwForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@bedrijf.nl"
                  />
                </div>

                <div className="ios-form-divider" />

                {/* Telefoon */}
                <div className="ios-form-field ios-form-field-full">
                  <span className="ios-form-field-label">Telefoon</span>
                  <input
                    className="ios-form-input"
                    type="tel"
                    inputMode="tel"
                    value={nieuwForm.phone}
                    onChange={e => setNieuwForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>

              {/* Adres inklapbaar */}
              <button
                type="button"
                className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/50 py-2 mt-1"
                onClick={() => setShowAdres(v => !v)}
              >
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdres && 'rotate-180')} />
                Adresgegevens {showAdres ? 'verbergen' : 'toevoegen'}
              </button>

              {showAdres && (
                <div className="ios-form-card">
                  <div className="ios-form-field ios-form-field-full">
                    <span className="ios-form-field-label">Adres</span>
                    <input
                      className="ios-form-input"
                      value={nieuwForm.address_line_1}
                      onChange={e => setNieuwForm(p => ({ ...p, address_line_1: e.target.value }))}
                      placeholder="Straat en huisnummer"
                    />
                  </div>
                  <div className="ios-form-divider" />
                  <div className="ios-form-input-row">
                    <div className="ios-form-field" style={{ flex: '0 0 100px' }}>
                      <span className="ios-form-field-label">Postcode</span>
                      <input
                        className="ios-form-input"
                        value={nieuwForm.postal_code}
                        onChange={e => setNieuwForm(p => ({ ...p, postal_code: e.target.value }))}
                        placeholder="1234 AB"
                      />
                    </div>
                    <div className="ios-form-field-divider" />
                    <div className="ios-form-field" style={{ flex: 1 }}>
                      <span className="ios-form-field-label">Plaats</span>
                      <input
                        className="ios-form-input"
                        value={nieuwForm.city}
                        onChange={e => setNieuwForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="px-5 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                className="ios-form-cta w-full"
                onClick={handleAanmaken}
                disabled={aanmakende || !nieuwForm.company_name.trim()}
              >
                {aanmakende ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aanmaken…
                  </span>
                ) : 'Klant aanmaken & doorgaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
