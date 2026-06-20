import { useEffect, useRef, useState } from 'react';
import type { MSRDiagram } from './types';

interface Props {
  diagram: MSRDiagram;
  zoom: number;
  onMoveElectrode: (id: string, x: number, y: number) => void;
  onMoveCabinet: (x: number, y: number) => void;
  selectedElectrodeId?: string | null;
  onSelectElectrode?: (id: string | null) => void;
}

type Drag =
  | { kind: 'cabinet'; offX: number; offY: number }
  | { kind: 'electrode'; id: string; offX: number; offY: number }
  | null;

export function DiagramCanvas({
  diagram,
  zoom,
  onMoveElectrode,
  onMoveCabinet,
  selectedElectrodeId,
  onSelectElectrode,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const { w, h } = diagram.canvasSize;
  const c = diagram.cabinet;
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const mpu = diagram.metersPerUnit ?? 0.05;

  // Convert a pointer event to diagram-unit coordinates.
  const toDiagram = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * w;
    const y = ((clientY - rect.top) / rect.height) * h;
    return { x, y };
  };

  useEffect(() => {
    if (!drag) return;
    const move = (ev: PointerEvent) => {
      const p = toDiagram(ev.clientX, ev.clientY);
      if (drag.kind === 'cabinet') {
        let nx = p.x - drag.offX;
        let ny = p.y - drag.offY;
        nx = Math.max(0, Math.min(w - c.w, nx));
        ny = Math.max(0, Math.min(h - c.h, ny));
        onMoveCabinet(nx, ny);
      } else {
        let nx = p.x - drag.offX;
        let ny = p.y - drag.offY;
        nx = Math.max(8, Math.min(w - 8, nx));
        ny = Math.max(8, Math.min(h - 8, ny));
        onMoveElectrode(drag.id, nx, ny);
      }
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, w, h, c.w, c.h, onMoveCabinet, onMoveElectrode]);

  // Door bar coordinates
  const door = (() => {
    if (c.doorSide === 'left') return { x1: c.x, y1: c.y + 8, x2: c.x, y2: c.y + c.h - 8 };
    if (c.doorSide === 'right') return { x1: c.x + c.w, y1: c.y + 8, x2: c.x + c.w, y2: c.y + c.h - 8 };
    if (c.doorSide === 'top') return { x1: c.x + 8, y1: c.y, x2: c.x + c.w - 8, y2: c.y };
    return { x1: c.x + 8, y1: c.y + c.h, x2: c.x + c.w - 8, y2: c.y + c.h };
  })();

  return (
    <div className="w-full h-full overflow-auto bg-muted/20 touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div style={{ width: w * zoom, height: h * zoom }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${h}`}
          width={w * zoom}
          height={h * zoom}
          style={{ display: 'block', background: '#fff', touchAction: 'none' }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onSelectElectrode?.(null);
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#eef0f3" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="url(#grid)" />

          {/* Distance lines + labels */}
          {diagram.electrodes.map((e) => {
            const dxU = e.x - cx;
            const dyU = e.y - cy;
            const distM = Math.sqrt(dxU * dxU + dyU * dyU) * mpu;
            const midX = (cx + e.x) / 2;
            const midY = (cy + e.y) / 2;
            return (
              <g key={`d-${e.id}`} pointerEvents="none">
                <line x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" />
                <text x={midX} y={midY - 6} textAnchor="middle" fontSize="11" fill="#475569">
                  {distM.toFixed(2).replace('.', ',')} m
                </text>
              </g>
            );
          })}

          {/* Cabinet */}
          <g
            onPointerDown={(e) => {
              e.preventDefault();
              (e.target as Element).setPointerCapture?.(e.pointerId);
              const p = toDiagram(e.clientX, e.clientY);
              setDrag({ kind: 'cabinet', offX: p.x - c.x, offY: p.y - c.y });
            }}
            style={{ cursor: 'move', touchAction: 'none' }}
          >
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#f1f5f9" stroke="#0f172a" strokeWidth={2} />
            <line x1={door.x1} y1={door.y1} x2={door.x2} y2={door.y2} stroke="#E8541A" strokeWidth={5} strokeLinecap="round" />
            <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">
              {c.housingNumber || 'MSR'}
            </text>
          </g>

          {/* Electrodes */}
          {diagram.electrodes.map((e) => {
            const sel = selectedElectrodeId === e.id;
            return (
              <g
                key={e.id}
                onPointerDown={(ev) => {
                  ev.preventDefault();
                  (ev.target as Element).setPointerCapture?.(ev.pointerId);
                  const p = toDiagram(ev.clientX, ev.clientY);
                  setDrag({ kind: 'electrode', id: e.id, offX: p.x - e.x, offY: p.y - e.y });
                  onSelectElectrode?.(e.id);
                }}
                style={{ cursor: 'grab', touchAction: 'none' }}
              >
                <circle cx={e.x} cy={e.y} r={sel ? 18 : 14} fill="#E8541A" stroke="#fff" strokeWidth={3} />
                <text x={e.x} y={e.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
                  {e.label || 'E'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
