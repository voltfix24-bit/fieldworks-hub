import type { MSRDiagram } from './types';

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

  // Electrodes + distance lines from cabinet center
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const mpu = diagram.metersPerUnit ?? 0.05;

  for (const e of diagram.electrodes) {
    // Line cabinet → electrode
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance label
    const dxU = e.x - cx;
    const dyU = e.y - cy;
    const distM = Math.sqrt(dxU * dxU + dyU * dyU) * mpu;
    const midX = (cx + e.x) / 2;
    const midY = (cy + e.y) / 2;
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${distM.toFixed(2).replace('.', ',')} m`, midX, midY - 6);

    // Electrode dot
    ctx.fillStyle = '#E8541A';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Electrode label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.label || 'E', e.x, e.y);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG-export mislukt'))), 'image/png');
  });
}
