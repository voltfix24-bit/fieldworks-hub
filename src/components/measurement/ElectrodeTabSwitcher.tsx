import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ElectrodeTabSwitcherProps {
  electrodes: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  addDisabled?: boolean;
}

export function ElectrodeTabSwitcher({ electrodes, activeId, onSelect, onAdd, addDisabled }: ElectrodeTabSwitcherProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {electrodes.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
            'border min-h-[40px]',
            e.id === activeId
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-foreground border-border hover:bg-muted/50'
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{e.electrode_code}</span>
          {e.label && <span className="text-xs opacity-75">· {e.label}</span>}
        </button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={addDisabled}
        className="min-h-[40px] px-3 border-dashed whitespace-nowrap"
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Elektrode
      </Button>
    </div>
  );
}
