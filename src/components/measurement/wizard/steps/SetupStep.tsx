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
    <div className="space-y-4">
      <WizardStepHeader title="Meetopstelling" subtitle="Stel de basisgegevens in voor deze meetsessie" />

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Meetdatum</Label>
          <Input type="date" value={measurementDate} onChange={e => setMeasurementDate(e.target.value)} className="h-11 text-sm mt-1" />
        </div>

        <div>
          <Label className="text-sm font-medium">Opdrachtgever</Label>
          <Select value={selectedClient || 'none'} onValueChange={v => setSelectedClient(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 text-sm mt-1"><SelectValue placeholder="Selecteer opdrachtgever" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Monteur</Label>
          <Select value={selectedTechnician || 'none'} onValueChange={v => setSelectedTechnician(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 text-sm mt-1"><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {technicians.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Apparatuur</Label>
          <Select value={selectedEquipment || 'none'} onValueChange={v => setSelectedEquipment(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 text-sm mt-1"><SelectValue placeholder="Selecteer apparatuur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Geen selectie —</SelectItem>
              {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Notities <span className="text-muted-foreground font-normal">(optioneel)</span></Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-sm min-h-[80px] mt-1" placeholder="Meetnotities…" />
        </div>
      </div>
    </div>
  );
}
