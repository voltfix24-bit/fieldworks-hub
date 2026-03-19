import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WizardStepHeader } from '../WizardStepHeader';

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
}

export function SetupStep({
  measurementDate, setMeasurementDate,
  selectedClient, setSelectedClient,
  selectedTechnician, setSelectedTechnician,
  selectedEquipment, setSelectedEquipment,
  notes, setNotes,
  clients, technicians, equipment,
}: SetupStepProps) {
  return (
    <div>
      <WizardStepHeader title="Meetopstelling" subtitle="Stel de basisgegevens in voor deze meetsessie" />

      <div className="space-y-5">
        <FieldGroup label="Meetdatum">
          <Input
            type="date"
            value={measurementDate}
            onChange={e => setMeasurementDate(e.target.value)}
            className="h-11 text-[13px]"
          />
        </FieldGroup>

        <FieldGroup label="Opdrachtgever">
          <Select value={selectedClient || 'none'} onValueChange={v => setSelectedClient(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 text-[13px]"><SelectValue placeholder="Selecteer opdrachtgever" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Monteur">
          <Select value={selectedTechnician || 'none'} onValueChange={v => setSelectedTechnician(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 text-[13px]"><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {technicians.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Apparatuur">
          <Select value={selectedEquipment || 'none'} onValueChange={v => setSelectedEquipment(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 text-[13px]"><SelectValue placeholder="Selecteer apparatuur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Notities" optional>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-[13px] min-h-[80px]"
            placeholder="Meetnotities…"
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function FieldGroup({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
        {optional && <span className="font-normal normal-case tracking-normal ml-1.5 text-muted-foreground/50">(optioneel)</span>}
      </Label>
      {children}
    </div>
  );
}
