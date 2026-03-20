interface ReportImageBlockProps {
  images: { url: string; label: string }[];
}

export function ReportImageBlock({ images }: ReportImageBlockProps) {
  const validImages = images.filter(img => img.url);
  if (validImages.length === 0) return null;

  return (
    <div className={`grid gap-4 mt-4 mb-2 ${validImages.length === 1 ? 'grid-cols-1 max-w-[240px]' : 'grid-cols-2 max-w-md'}`}>
      {validImages.map((img, i) => (
        <figure key={i} className="page-break-inside-avoid">
          <img
            src={img.url}
            alt={img.label}
            className="w-full h-auto max-h-48 object-cover border border-foreground/10 print:max-h-36"
          />
          <figcaption className="text-[10px] text-muted-foreground mt-1.5 italic">{img.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
