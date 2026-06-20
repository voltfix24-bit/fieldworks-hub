export async function exportSvgToPng(svg: SVGSVGElement, fileName = 'situatieschets.png'): Promise<File> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.querySelectorAll('[data-export-hidden="true"]').forEach((node) => node.remove());

  const viewBox = clone.getAttribute('viewBox') || '0 0 600 800';
  const [, , widthRaw, heightRaw] = viewBox.split(/\s+/).map(Number);
  const width = Number.isFinite(widthRaw) ? widthRaw : 600;
  const height = Number.isFinite(heightRaw) ? heightRaw : 800;

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas wordt niet ondersteund');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG export mislukt'));
      }, 'image/png', 0.92);
    });

    return new File([pngBlob], fileName, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Schets kon niet worden geladen voor export'));
    image.src = url;
  });
}
