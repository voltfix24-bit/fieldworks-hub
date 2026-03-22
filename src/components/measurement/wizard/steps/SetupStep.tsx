import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCombobox } from '@/components/ui/ClientCombobox';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { formatNlDate } from '@/lib/nl-date';

interface SetupStepProps {
  measurementDate: string;
  setMeasurementDate: (v: string) => void;
  selectedClient: string;
  setSelectedClient: (v: string) => void;
  selectedTechnician: string;
  setSelectedTechnician: (v: string) => void;
  selectedEquipment: string;
  setSelectedEquipment: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  targetValue: string;
  onTargetValueChange: (v: string) => void;
  clients: any[];
  technicians: any[];
  equipment: any[];
  compact?: boolean;
}

export function SetupStep({
  measurementDate, setMeasurementDate,
  selectedClient, setSelectedClient,
  selectedTechnician, setSelectedTechnician,
  selectedEquipment, setSelectedEquipment,
  notes, setNotes,
  targetValue, onTargetValueChange,
  clients, technicians, equipment, compact,
}: SetupStepProps) {
  const fieldH = compact ? 'h-8' : 'h-11';
  const fieldText = compact ? 'text-[11px]' : 'text-[13px]';

  // Calibration warning logic
  const geselecteerdApparaat = equipment.find((e: any) => e.id === selectedEquipment);
  const kalibratieVerlopen = geselecteerdApparaat?.next_calibration_date &&
    new Date(geselecteerdApparaat.next_calibration_date) < new Date();
  const kalibratieVerlooptSpoedig = geselecteerdApparaat?.next_calibration_date &&
    !kalibratieVerlopen &&
    new Date(geselecteerdApparaat.next_calibration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div>
      <div className={compact ? 'mb-1.5' : 'mb-4'}>
        <h2 className={cn(
          'font-semibold text-foreground tracking-tight',
          compact ? 'text-[12px]' : 'text-[15px]'
        )}>
          Meetopstelling
        </h2>
        <p className={cn(
          'text-muted-foreground/60 mt-0.5',
          compact ? 'text-[10px]' : 'text-[13px]'
        )}>
          Basisgegevens voor deze meetsessie
        </p>
      </div>

      <div className={compact ? 'space-y-2.5' : 'space-y-5'}>
        <FieldGroup label="Meetdatum" compact={compact}>
          <Input type="date" value={measurementDate} onChange={e => setMeasurementDate(e.target.value)} className={cn(fieldH, fieldText)} />
        </FieldGroup>

        <FieldGroup label="Opdrachtgever" compact={compact}>
          <Select value={selectedClient || 'none'} onValueChange={v => setSelectedClient(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(fieldH, fieldText)}><SelectValue placeholder="Selecteer opdrachtgever" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Monteur" compact={compact}>
          <Select value={selectedTechnician || 'none'} onValueChange={v => setSelectedTechnician(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(fieldH, fieldText)}><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {technicians.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Apparatuur" compact={compact}>
          <Select value={selectedEquipment || 'none'} onValueChange={v => setSelectedEquipment(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(fieldH, fieldText)}><SelectValue placeholder="Selecteer apparatuur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Calibration warnings */}
        {kalibratieVerlopen && (
          <div className={cn(
            'flex items-start gap-2.5 rounded-xl border px-3',
            compact ? 'py-2' : 'py-3',
            'bg-destructive/5 border-destructive/20'
          )}>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className={cn('font-semibold text-destructive', compact ? 'text-[10px]' : 'text-[12px]')}>
                Kalibratie verlopen
              </p>
              <p className={cn('text-destructive/70 mt-0.5', compact ? 'text-[9px]' : 'text-[11px]')}>
                Verlopen op {formatNlDate(geselecteerdApparaat.next_calibration_date)}. Dit apparaat mag niet worden gebruikt voor officiële metingen.
              </p>
            </div>
          </div>
        )}

        {!kalibratieVerlopen && kalibratieVerlooptSpoedig && (
          <div className={cn(
            'flex items-start gap-2.5 rounded-xl border px-3',
            compact ? 'py-2' : 'py-3',
            'bg-amber-500/5 border-amber-500/20'
          )}>
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className={cn('text-amber-700 dark:text-amber-400 font-medium', compact ? 'text-[10px]' : 'text-[11px]')}>
              Kalibratie verloopt binnenkort op {formatNlDate(geselecteerdApparaat.next_calibration_date)}. Plan een nieuwe kalibratie.
            </p>
          </div>
        )}

        <FieldGroup label="Toetswaarde (Ω)" compact={compact}>
          <Input
            inputMode="decimal"
            value={targetValue}
            onChange={e => onTargetValueChange(e.target.value)}
            placeholder="3.00"
            className={cn(fieldH, fieldText)}
          />
        </FieldGroup>

        <FieldGroup label="Notities" optional compact={compact}>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={cn(fieldText, compact ? 'min-h-[48px]' : 'min-h-[80px]')}
            placeholder="Meetnotities…"
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function FieldGroup({ label, optional, children, compact }: { label: string; optional?: boolean; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1.5'}>
      <Label className={cn(
        'font-semibold text-muted-foreground/60 uppercase tracking-wide',
        compact ? 'text-[9px]' : 'text-[12px]'
      )}>
        {label}
        {optional && <span className="font-normal normal-case tracking-normal ml-1 text-muted-foreground/40">(optioneel)</span>}
      </Label>
      {children}
    </div>
  );
}
