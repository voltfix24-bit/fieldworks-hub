import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElectrodeTabSwitcherProps {
  electrodes: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  addDisabled?: boolean;
}

/**
 * Pill-style elektrode tabs (mobiel-eerst).
 * - Actieve pill: filled met tenant-primary (oranje), wit label.
 * - Inactieve pill: wit met dunne border.
 * - "+ Elektrode": gestippelde outline pill.
 */
export function ElectrodeTabSwitcher({ electrodes, activeId, onSelect, onAdd, addDisabled }: ElectrodeTabSwitcherProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
      {electrodes.map((e) => {
        const isActive = e.id === activeId;
        return (
          <button
            key={e.id}
            type="button"
            onMouseDown={(ev) => {
              ev.preventDefault();
              (document.activeElement as HTMLElement)?.blur();
              setTimeout(() => onSelect(e.id), 30);
            }}
            className={cn(
              'shrink-0 inline-flex items-center justify-center whitespace-nowrap',
              'h-11 px-6 rounded-full text-[15px] font-bold tracking-tight',
              'transition-all duration-150 active:scale-[0.97]',
              isActive
                ? 'bg-[hsl(var(--tenant-primary,var(--primary)))] text-white shadow-[0_2px_8px_-2px_hsl(var(--tenant-primary,var(--primary))/0.45)]'
                : 'bg-card text-foreground border border-border/50',
            )}
          >
            <span>{e.electrode_code}</span>
            {e.label && <span className="ml-1.5 text-[12px] font-medium opacity-70">· {e.label}</span>}
          </button>
        );
      })}

      <button
        type="button"
        onMouseDown={(ev) => {
          ev.preventDefault();
          (document.activeElement as HTMLElement)?.blur();
          setTimeout(onAdd, 30);
        }}
        disabled={addDisabled}
        className={cn(
          'shrink-0 inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
          'h-11 px-5 rounded-full text-[14px] font-bold tracking-tight',
          'border border-dashed border-border/60 text-foreground/70 bg-transparent',
          'transition-all duration-150 active:scale-[0.97]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        <Plus className="h-4 w-4" />
        Elektrode
      </button>
    </div>
  );
}

