interface ReportImageBlockProps {
  images: { url: string; label: string }[];
}

export function ReportImageBlock({ images }: ReportImageBlockProps) {
  const validImages = images.filter(img => img.url);
  if (validImages.length === 0) return null;

  return (
    <div className={`grid gap-4 mt-3 ${validImages.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'}`}>
      {validImages.map((img, i) => (
        <figure key={i} className="page-break-inside-avoid">
          <img src={img.url} alt={img.label} className="w-full h-auto max-h-52 object-cover rounded border border-border print:max-h-40" />
          <figcaption className="text-[10px] text-muted-foreground mt-1">{img.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
