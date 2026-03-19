interface ReportImageBlockProps {
  images: { url: string; label: string }[];
}

export function ReportImageBlock({ images }: ReportImageBlockProps) {
  const validImages = images.filter(img => img.url);
  if (validImages.length === 0) return null;

  return (
    <div className={`grid gap-3 mt-2 ${validImages.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2'}`}>
      {validImages.map((img, i) => (
        <div key={i}>
          <img src={img.url} alt={img.label} className="w-full h-auto max-h-48 object-cover rounded border border-border" />
          <p className="text-[10px] text-muted-foreground mt-1 text-center">{img.label}</p>
        </div>
      ))}
    </div>
  );
}
