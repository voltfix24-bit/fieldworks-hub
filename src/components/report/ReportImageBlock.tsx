interface ReportImageBlockProps {
  images: { url: string; label: string }[];
}

export function ReportImageBlock({ images }: ReportImageBlockProps) {
  const validImages = images.filter(img => img.url);
  if (validImages.length === 0) return null;

  return (
    <div className={`grid gap-3 mt-3 mb-2 ${validImages.length === 1 ? 'grid-cols-1 max-w-[200px]' : 'grid-cols-2 max-w-sm'}`}>
      {validImages.map((img, i) => (
        <figure key={i} className="page-break-inside-avoid">
          <img
            src={img.url}
            alt={img.label}
            className="w-full h-auto max-h-40 object-cover border border-foreground/8 print:max-h-32"
          />
          <figcaption className="text-[9px] text-muted-foreground mt-1 italic">{img.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
