import { getSupabase } from '../db';
import { logAction } from './audit';
import type { MediaAssetRow, MediaType } from '../types';

export interface ListMediaParams {
  search?: string;
  type?: MediaType | 'all';
}

export interface MediaUploadMeta {
  optimized: boolean;
  originalBytes: number;
  uploadedBytes: number;
  reductionPct: number;
  originalType: string;
  uploadedType: string;
  reason?: string;
}

export interface UploadFileOptions {
  optimizeImagesToWebp?: boolean;
  webpQuality?: number;
  maxImageDimension?: number;
}

/** Extract `bucket/path` object path from a Supabase public object URL, or null. */
export function storagePathFromPublicMediaUrl(url: string): string | null {
  const marker = '/object/public/media/';
  const i = url.indexOf(marker);
  if (i === -1) return null;
  try {
    return decodeURIComponent(url.slice(i + marker.length).split('?')[0] ?? '');
  } catch {
    return null;
  }
}

export async function listMedia(params: ListMediaParams = {}) {
  const supabase = getSupabase();
  const { search = '', type = 'all' } = params;
  let query = supabase.from('media_assets').select('*').order('uploaded_at', { ascending: false });
  if (type !== 'all') query = query.eq('type', type);
  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`filename.ilike.${q},uploaded_by.ilike.${q}`);
  }
  const { data, error } = await query;
  return { data: (data ?? []) as MediaAssetRow[], error };
}

/** @deprecated Prefer `uploadFileToStorage` - blob URLs are not valid cross-device. */
export async function uploadMedia(
  files: { filename: string; url: string; type: MediaType; size_bytes: number }[]
) {
  const supabase = getSupabase();
  const rows = files.map((f, i) => ({
    id: `media-${Date.now()}-${i}`,
    filename: f.filename,
    url: f.url,
    type: f.type,
    size_bytes: f.size_bytes,
    size_label: formatBytes(f.size_bytes),
    uploaded_by: 'Admin',
    uploaded_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase.from('media_assets').insert(rows).select('*');
  if (!error && rows.length > 0) {
    void logAction('Uploaded media', `${rows.length} file${rows.length === 1 ? '' : 's'}`, 'Admin', 'image');
  }
  return { data: (data ?? []) as MediaAssetRow[], error };
}

export async function deleteMedia(id: string) {
  const supabase = getSupabase();
  const { data: row } = await supabase.from('media_assets').select('url').eq('id', id).maybeSingle();
  const path = row?.url ? storagePathFromPublicMediaUrl(row.url) : null;
  if (path) {
    const { error: rmErr } = await supabase.storage.from('media').remove([path]);
    if (rmErr) {
      // eslint-disable-next-line no-console
      console.warn('[media] Storage delete failed (continuing with DB row):', rmErr.message);
    }
  }
  const { error } = await supabase.from('media_assets').delete().eq('id', id);
  if (!error) void logAction('Deleted media', id, 'Admin', 'image');
  return { data: !error, error };
}

/**
 * Upload a real File to the `media` storage bucket and persist a row.
 */
export async function uploadFileToStorage(
  file: File,
  uploadedBy = 'Editor',
  options: UploadFileOptions = {}
): Promise<{ data: MediaAssetRow | null; error: { message: string } | null; meta: MediaUploadMeta }> {
  const supabase = getSupabase();
  const prepared = await optimizeImageToWebp(file, options);
  const uploadFile = prepared.file;
  const safeName = uploadFile.name.replace(/[^A-Za-z0-9._-]/g, '-');
  const path = `${new Date().getFullYear()}/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage.from('media').upload(path, uploadFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: uploadFile.type || undefined,
  });
  if (upErr) return { data: null, error: { message: upErr.message ?? 'Upload failed.' }, meta: prepared.meta };
  const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
  const row: Omit<MediaAssetRow, 'id'> & { id: string } = {
    id: `media-${Date.now()}`,
    filename: uploadFile.name,
    url: pub.publicUrl,
    type: uploadFile.type.startsWith('video') ? 'video' : 'image',
    size_bytes: uploadFile.size,
    size_label: formatBytes(uploadFile.size),
    uploaded_by: uploadedBy,
    uploaded_at: new Date().toISOString(),
    alt_text: null,
    optimization_meta: prepared.meta,
  };
  let { data, error } = await supabase.from('media_assets').insert(row).select('*').single();
  // Backward compatibility: if the DB has not yet applied the new
  // `optimization_meta` column migration, retry without that column.
  if (error && error.code === '42703') {
    const { optimization_meta: _drop, ...legacyRow } = row;
    void _drop;
    const retry = await supabase.from('media_assets').insert(legacyRow).select('*').single();
    data = retry.data;
    error = retry.error;
  }
  if (error) return { data: null, error: { message: error.message ?? 'Failed to record asset.' }, meta: prepared.meta };
  void logAction('Uploaded media', uploadFile.name, uploadedBy, 'image');
  return { data: data as MediaAssetRow, error: null, meta: prepared.meta };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function optimizeImageToWebp(file: File, options: UploadFileOptions): Promise<{ file: File; meta: MediaUploadMeta }> {
  const baseMeta: MediaUploadMeta = {
    optimized: false,
    originalBytes: file.size,
    uploadedBytes: file.size,
    reductionPct: 0,
    originalType: file.type || 'application/octet-stream',
    uploadedType: file.type || 'application/octet-stream',
  };
  const optimizeImagesToWebp = options.optimizeImagesToWebp ?? true;
  const quality = Math.min(0.95, Math.max(0.55, options.webpQuality ?? 0.82));
  const maxDimension = Math.max(960, Math.min(4000, options.maxImageDimension ?? 2560));

  if (!optimizeImagesToWebp) return { file, meta: baseMeta };
  if (!file.type.startsWith('image/')) return { file, meta: baseMeta };
  // Preserve potentially lossy/special cases. Canvas conversion can flatten
  // animation (GIF), rasterize vectors (SVG), or double-lossy encode WebP.
  if (file.type === 'image/gif') {
    return { file, meta: { ...baseMeta, reason: 'GIF kept to preserve animation.' } };
  }
  if (file.type === 'image/svg+xml') {
    return { file, meta: { ...baseMeta, reason: 'SVG kept as vector.' } };
  }
  if (file.type === 'image/webp') {
    return { file, meta: { ...baseMeta, reason: 'Source is already WebP.' } };
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { file, meta: { ...baseMeta, reason: 'Image optimization requires browser canvas.' } };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { file, meta: { ...baseMeta, reason: 'Canvas context unavailable.' } };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    });
    if (!blob) {
      return { file, meta: { ...baseMeta, reason: 'WebP conversion failed.' } };
    }

    const originalBase = file.name.replace(/\.[A-Za-z0-9]+$/, '');
    const webpName = `${originalBase || 'image'}.webp`;
    const converted = new File([blob], webpName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    // Keep original if conversion unexpectedly inflates size.
    if (converted.size >= file.size) {
      return {
        file,
        meta: {
          ...baseMeta,
          reason: 'Original file is already smaller than converted WebP.',
        },
      };
    }

    const reductionPct = Math.round(((file.size - converted.size) / file.size) * 100);
    return {
      file: converted,
      meta: {
        optimized: true,
        originalBytes: file.size,
        uploadedBytes: converted.size,
        reductionPct,
        originalType: file.type || 'application/octet-stream',
        uploadedType: 'image/webp',
      },
    };
  } catch {
    return {
      file,
      meta: {
        ...baseMeta,
        reason: 'Image format could not be decoded for WebP optimization.',
      },
    };
  }
}
