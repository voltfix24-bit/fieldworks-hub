import { Plus, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PenTabSwitcherProps {
  pens: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  addDisabled?: boolean;
}

export function PenTabSwitcher({ pens, activeId, onSelect, onAdd, addDisabled }: PenTabSwitcherProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      {pens.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all',
            'min-h-[34px]',
            p.id === activeId
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          )}
        >
          <PenTool className="h-3 w-3" />
          <span>{p.pen_code}</span>
          {p.label && <span className="opacity-70">· {p.label}</span>}
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        disabled={addDisabled}
        className="min-h-[34px] h-auto px-2.5 py-1.5 text-xs text-muted-foreground hover:text-accent border border-dashed border-transparent hover:border-accent/30"
      >
        <Plus className="h-3 w-3 mr-1" /> Pen
      </Button>
    </div>
  );
}
