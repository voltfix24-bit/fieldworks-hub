import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEquipmentList } from '@/hooks/use-equipment';
import { Wrench, Plus, AlertTriangle, Star } from 'lucide-react';

function isCalibrationWarning(nextDate: string | null): boolean {
  if (!nextDate) return false;
  const next = new Date(nextDate);
  const now = new Date();
  const daysUntil = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntil <= 30;
}

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const { data: equipment, isLoading } = useEquipmentList();
  const navigate = useNavigate();

  const filtered = equipment?.filter(e =>
    [e.device_name, e.brand, e.model, e.serial_number]
      .filter(Boolean)
      .some(f => f!.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Equipment"
        description="Track measurement instruments and calibration status"
        action={<Button onClick={() => navigate('/equipment/new')}><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : equipment?.length === 0 ? (
        <EmptyState icon={Wrench} title="No equipment registered" description="Register measurement instruments for tracking and calibration."
          action={<Button variant="outline" onClick={() => navigate('/equipment/new')}><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>}
        />
      ) : (
        <>
          <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search equipment..." />

          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Device</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Brand / Model</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Serial</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Calibration</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Next Cal.</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(eq => (
                      <tr key={eq.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/equipment/${eq.id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{eq.device_name}</span>
                            {eq.is_default && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-tenant-primary text-tenant-primary"><Star className="h-3 w-3 mr-0.5" />Default</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{[eq.brand, eq.model].filter(Boolean).join(' ') || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{eq.serial_number || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{eq.calibration_date || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={isCalibrationWarning(eq.next_calibration_date) ? 'text-destructive font-medium flex items-center gap-1' : 'text-muted-foreground'}>
                            {isCalibrationWarning(eq.next_calibration_date) && <AlertTriangle className="h-3 w-3" />}
                            {eq.next_calibration_date || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={eq.is_active ? 'active' : 'inactive'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(eq => (
              <Card key={eq.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/equipment/${eq.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{eq.device_name}</p>
                        {eq.is_default && <Badge variant="outline" className="text-[10px] px-1.5 py-0"><Star className="h-3 w-3 mr-0.5" />Default</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{[eq.brand, eq.model].filter(Boolean).join(' ')}</p>
                    </div>
                    <StatusBadge status={eq.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {eq.serial_number && <span className="font-mono">SN: {eq.serial_number}</span>}
                    {eq.next_calibration_date && (
                      <span className={isCalibrationWarning(eq.next_calibration_date) ? 'text-destructive font-medium flex items-center gap-1' : ''}>
                        {isCalibrationWarning(eq.next_calibration_date) && <AlertTriangle className="h-3 w-3" />}
                        Next cal: {eq.next_calibration_date}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && search && <p className="text-sm text-muted-foreground text-center py-8">No equipment matches "{search}"</p>}
        </>
      )}
    </div>
  );
}
