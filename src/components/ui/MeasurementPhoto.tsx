import { useEffect, useState } from 'react';
import { signMeasurementPhotoUrl } from '@/lib/storage-urls';

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallback?: React.ReactNode;
}

/**
 * Image element that resolves a stored measurement-photo reference
 * (storage path or legacy public URL) to a short-lived signed URL.
 *
 * Use this everywhere a `pen.display_photo_url` / `pen.overview_photo_url`
 * is rendered — the bucket is private after security hardening.
 */
export function MeasurementPhoto({ src, fallback, ...imgProps }: Props) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    if (!src) return;
    // If the caller passed a blob: or data: URL (local preview), use it as-is
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setResolved(src);
      return;
    }
    signMeasurementPhotoUrl(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!resolved) return <>{fallback ?? null}</>;
  return <img {...imgProps} src={resolved} />;
}
