import { supabase } from '@/integrations/supabase/client';

const MEASUREMENT_BUCKET = 'measurement-photos';

/**
 * Given either a legacy public Supabase URL or a storage path,
 * extract the storage path inside the measurement-photos bucket.
 * Returns null if it can't be parsed (e.g. external URL).
 */
export function extractMeasurementPhotoPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith('http')) {
    // already a storage path
    return stored.replace(/^\/+/, '');
  }
  const marker = `/storage/v1/object/public/${MEASUREMENT_BUCKET}/`;
  const idx = stored.indexOf(marker);
  if (idx === -1) {
    const signedMarker = `/storage/v1/object/sign/${MEASUREMENT_BUCKET}/`;
    const sIdx = stored.indexOf(signedMarker);
    if (sIdx === -1) return null;
    return stored.slice(sIdx + signedMarker.length).split('?')[0];
  }
  return stored.slice(idx + marker.length);
}

/**
 * Return a short-lived signed URL for displaying a measurement photo.
 * Accepts either a storage path or a legacy public URL.
 */
export async function signMeasurementPhotoUrl(
  stored: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const path = extractMeasurementPhotoPath(stored);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(MEASUREMENT_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
