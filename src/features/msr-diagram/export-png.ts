import type { DiagramCabinet, DiagramElectrode, MSRAnchor, MSRDiagram } from './types';

/**
 * Render the diagram to an off-screen 2D canvas and return a PNG blob.
 * Avoids SVG-serialization taint issues; we draw the model directly.
 */
export async function renderDiagramToPng(
  diagram: MSRDiagram,
  opts: { scale?: number } = {},
): Promise<Blob> {
  const scale = opts.scale ?? 2; // export at 2x for crispness
  const { w, h } = diagram.canvasSize;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas niet beschikbaar');
  ctx.scale(scale, scale);

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#eef0f3';
  ctx.lineWidth = 1;
  const grid = 40;
  for (let x = 0; x <= w; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Cabinet
  const c = diagram.cabinet;
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeRect(c.x, c.y, c.w, c.h);

  // Door indicator on chosen side (thick orange line)
  ctx.strokeStyle = '#E8541A';
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (c.doorSide === 'left') {
    ctx.moveTo(c.x, c.y + 8);
    ctx.lineTo(c.x, c.y + c.h - 8);
  } else if (c.doorSide === 'right') {
    ctx.moveTo(c.x + c.w, c.y + 8);
    ctx.lineTo(c.x + c.w, c.y + c.h - 8);
  } else if (c.doorSide === 'top') {
    ctx.moveTo(c.x + 8, c.y);
    ctx.lineTo(c.x + c.w - 8, c.y);
  } else {
    ctx.moveTo(c.x + 8, c.y + c.h);
    ctx.lineTo(c.x + c.w - 8, c.y + c.h);
  }
  ctx.stroke();

  // Housing number label
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.housingNumber || 'MSR', c.x + c.w / 2, c.y + c.h / 2);

  const mpu = diagram.metersPerUnit ?? 0.05;

  for (const e of diagram.electrodes) {
    const anchor = getAnchorPoint(c, e.anchor ?? 'br');
    const distances = getDistances(e, anchor, mpu);

    // Orthogonal distance lines from selected MSR corner.
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(e.x, anchor.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anchor marker.
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Distance labels.
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`H ${formatMeters(distances.x)}`, (anchor.x + e.x) / 2, anchor.y - 7);
    ctx.textAlign = 'left';
    ctx.fillText(`V ${formatMeters(distances.y)}`, e.x + 8, (anchor.y + e.y) / 2);

    // Electrode earth symbol.
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#E8541A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - 11);
    ctx.lineTo(e.x, e.y + 3);
    ctx.moveTo(e.x - 11, e.y + 3);
    ctx.lineTo(e.x + 11, e.y + 3);
    ctx.moveTo(e.x - 8, e.y + 8);
    ctx.lineTo(e.x + 8, e.y + 8);
    ctx.moveTo(e.x - 5, e.y + 13);
    ctx.lineTo(e.x + 5, e.y + 13);
    ctx.stroke();

    // Electrode label.
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.label || 'E', e.x, e.y + 34);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG-export mislukt'))), 'image/png');
  });
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
