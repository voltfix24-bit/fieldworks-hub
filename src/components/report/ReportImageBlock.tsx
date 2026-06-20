import { MeasurementPhoto } from '@/components/ui/MeasurementPhoto';

interface ReportImageBlockProps {
  images: { url: string; label: string }[];
}

export function ReportImageBlock({ images }: ReportImageBlockProps) {
  const validImages = images.filter(img => img.url);
  if (validImages.length === 0) return null;

  return (
    <div className="mt-5 page-break-inside-avoid">
      <h4 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-700">
        <span className="h-0.5 w-4 rounded-full bg-[hsl(var(--tenant-primary))]" />
        Documentatiefoto's
      </h4>
      <div className={`grid gap-4 ${validImages.length === 1 ? 'grid-cols-1 max-w-[360px]' : 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'}`}>
        {validImages.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white page-break-inside-avoid">
            <MeasurementPhoto
              src={img.url}
              alt={img.label}
              className="block h-48 w-full object-cover print:h-36"
            />
            <figcaption className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-center text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {img.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
