import type { DoorSide } from './types';
import { cn } from '@/lib/utils';

interface Props {
  value: DoorSide;
  onChange: (v: DoorSide) => void;
}

const OPTIONS: { v: DoorSide; label: string }[] = [
  { v: 'left', label: 'Links' },
  { v: 'right', label: 'Rechts' },
  { v: 'top', label: 'Boven' },
  { v: 'bottom', label: 'Onder' },
];

export function DoorSideSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'h-9 rounded-lg text-[12px] font-medium border transition-all active:scale-[0.97]',
            value === o.v
              ? 'bg-[hsl(var(--tenant-primary,var(--primary)))] text-white border-transparent'
              : 'bg-card text-muted-foreground border-border/60',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
