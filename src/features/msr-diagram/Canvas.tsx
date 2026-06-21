import { useEffect, useRef, useState } from 'react';
import type { DiagramCabinet, DiagramElectrode, MSRAnchor, MSRDiagram } from './types';

interface Props {
  diagram: MSRDiagram;
  zoom: number;
  onMoveElectrode: (id: string, x: number, y: number) => void;
  onMoveCabinet: (x: number, y: number) => void;
  onEditDistance?: (id: string, axis: 'x' | 'y', currentValue: number) => void;
  selectedElectrodeId?: string | null;
  cabinetSelected?: boolean;
  onSelectElectrode?: (id: string | null) => void;
  onSelectCabinet?: () => void;
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
  onEditDistance,
  selectedElectrodeId,
  cabinetSelected,
  onSelectElectrode,
  onSelectCabinet,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const { w, h } = diagram.canvasSize;
  const c = diagram.cabinet;
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
            const anchor = getAnchorPoint(c, e.anchor ?? 'br');
            const distances = getDistances(e, anchor, mpu);
            const selected = selectedElectrodeId === e.id;
            const horizontalLabelX = (anchor.x + e.x) / 2;
            const horizontalLabelY = anchor.y - 7;
            const verticalLabelX = e.x + 8;
            const verticalLabelY = (anchor.y + e.y) / 2;
            return (
              <g key={`d-${e.id}`}>
                <g pointerEvents="none">
                  <line x1={anchor.x} y1={anchor.y} x2={e.x} y2={anchor.y} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4 4" />
                  <line x1={e.x} y1={anchor.y} x2={e.x} y2={e.y} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4 4" />
                  <circle cx={anchor.x} cy={anchor.y} r={selected ? 6 : 4} fill="#ef4444" />
                  <circle cx={anchor.x} cy={anchor.y} r={2} fill="#ffffff" />
                </g>
                <g
                  role="button"
                  aria-label="Horizontale afstand aanpassen"
                  onPointerDown={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    onSelectElectrode?.(e.id);
                    onEditDistance?.(e.id, 'x', distances.x);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect x={horizontalLabelX - 34} y={horizontalLabelY - 17} width="68" height="22" rx="7" fill="#ffffff" stroke="#cbd5e1" />
                  <text x={horizontalLabelX} y={horizontalLabelY} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
                    H {formatMeters(distances.x)}
                  </text>
                </g>
                <g
                  role="button"
                  aria-label="Verticale afstand aanpassen"
                  onPointerDown={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    onSelectElectrode?.(e.id);
                    onEditDistance?.(e.id, 'y', distances.y);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect x={verticalLabelX - 4} y={verticalLabelY - 16} width="72" height="22" rx="7" fill="#ffffff" stroke="#cbd5e1" />
                  <text x={verticalLabelX + 32} y={verticalLabelY} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
                    V {formatMeters(distances.y)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Cabinet */}
          <g
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              (e.target as Element).setPointerCapture?.(e.pointerId);
              const p = toDiagram(e.clientX, e.clientY);
              setDrag({ kind: 'cabinet', offX: p.x - c.x, offY: p.y - c.y });
              onSelectCabinet?.();
            }}
            style={{ cursor: 'move', touchAction: 'none' }}
          >
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#f1f5f9" stroke={cabinetSelected ? '#E8541A' : '#0f172a'} strokeWidth={cabinetSelected ? 3 : 2} />
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
                <circle cx={e.x} cy={e.y} r="26" fill="transparent" />
                <circle cx={e.x} cy={e.y} r={sel ? 18 : 16} fill={sel ? '#fff7ed' : '#ffffff'} stroke="#E8541A" strokeWidth={sel ? 3 : 2} />
                <line x1={e.x} y1={e.y - 11} x2={e.x} y2={e.y + 3} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1={e.x - 11} y1={e.y + 3} x2={e.x + 11} y2={e.y + 3} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1={e.x - 8} y1={e.y + 8} x2={e.x + 8} y2={e.y + 8} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1={e.x - 5} y1={e.y + 13} x2={e.x + 5} y2={e.y + 13} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <text x={e.x} y={e.y + 34} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
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

function getAnchorPoint(cabinet: DiagramCabinet, anchor: MSRAnchor) {
  if (anchor === 'tl') return { x: cabinet.x, y: cabinet.y };
  if (anchor === 'tr') return { x: cabinet.x + cabinet.w, y: cabinet.y };
  if (anchor === 'bl') return { x: cabinet.x, y: cabinet.y + cabinet.h };
  return { x: cabinet.x + cabinet.w, y: cabinet.y + cabinet.h };
}

function getDistances(electrode: DiagramElectrode, anchor: { x: number; y: number }, metersPerUnit: number) {
  return {
    x: electrode.overrideDistanceX ?? roundMeters(Math.abs(electrode.x - anchor.x) * metersPerUnit),
    y: electrode.overrideDistanceY ?? roundMeters(Math.abs(electrode.y - anchor.y) * metersPerUnit),
  };
}

function roundMeters(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMeters(value: number) {
  return `${value.toFixed(2).replace('.', ',')} m`;
}
