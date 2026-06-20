import { Minus, Plus, Maximize2 } from 'lucide-react';

interface Props {
  zoom: number;
  onZoom: (z: number) => void;
}

export function ZoomControls({ zoom, onZoom }: Props) {
  const clamp = (v: number) => Math.max(0.5, Math.min(3, v));
  return (
    <div className="flex flex-col gap-1.5 p-1 rounded-xl bg-card/95 backdrop-blur border border-border/60 shadow">
      <button
        onClick={() => onZoom(clamp(zoom + 0.25))}
        className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/30 active:scale-95"
        aria-label="Inzoomen"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={() => onZoom(1)}
        className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/30 active:scale-95 text-[10px] font-semibold text-muted-foreground"
        aria-label="Reset zoom"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onZoom(clamp(zoom - 0.25))}
        className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/30 active:scale-95"
        aria-label="Uitzoomen"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
