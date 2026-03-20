import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  clients, technicians, equipment, compact,
}: SetupStepProps) {
  const fieldH = compact ? 'h-9' : 'h-11';
  const fieldText = compact ? 'text-[12px]' : 'text-[13px]';

  return (
    <div>
      <div className={compact ? 'mb-2' : 'mb-4'}>
        <h2 className={`font-semibold text-foreground tracking-tight ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
          Meetopstelling
        </h2>
        <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
          Basisgegevens voor deze meetsessie
        </p>
      </div>

      <div className={compact ? 'space-y-3' : 'space-y-5'}>
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

        <FieldGroup label="Notities" optional compact={compact}>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={cn(fieldText, compact ? 'min-h-[56px]' : 'min-h-[80px]')}
            placeholder="Meetnotities…"
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function FieldGroup({ label, optional, children, compact }: { label: string; optional?: boolean; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <Label className={cn(
        'font-semibold text-muted-foreground uppercase tracking-wide',
        compact ? 'text-[10px]' : 'text-[12px]'
      )}>
        {label}
        {optional && <span className="font-normal normal-case tracking-normal ml-1.5 text-muted-foreground/50">(optioneel)</span>}
      </Label>
      {children}
    </div>
  );
}
