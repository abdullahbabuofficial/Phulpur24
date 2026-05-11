import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { json, requireStaff } from '@/app/api/admin/_auth';
import type { MediaAssetRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const IMAGE_EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  ico: 'image/x-icon',
  heic: 'image/heic',
  heif: 'image/heif',
};

type MediaKind = 'image' | 'video';

interface PreparedUpload {
  file: File;
  kind: MediaKind;
  normalizedType: string;
  meta: {
    optimized: boolean;
    originalBytes: number;
    uploadedBytes: number;
    reductionPct: number;
    originalType: string;
    uploadedType: string;
    reason?: string;
  };
}

function inferMedia(file: File): { kind: MediaKind | null; normalizedType: string } {
  const fromType = (file.type || '').toLowerCase().trim();
  if (fromType.startsWith('image/')) return { kind: 'image', normalizedType: fromType };
  if (fromType.startsWith('video/')) return { kind: 'video', normalizedType: fromType };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext in IMAGE_EXT_MIME) {
    return { kind: 'image', normalizedType: IMAGE_EXT_MIME[ext] };
  }
  return { kind: null, normalizedType: fromType || 'application/octet-stream' };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function maybeOptimizeImageToWebp(
  file: File,
  normalizedType: string,
  optimizeImagesToWebp: boolean,
  quality: number,
  maxDimension: number
): Promise<PreparedUpload> {
  const baseMeta = {
    optimized: false,
    originalBytes: file.size,
    uploadedBytes: file.size,
    reductionPct: 0,
    originalType: normalizedType,
    uploadedType: normalizedType,
  };

  if (!optimizeImagesToWebp) {
    return { file, kind: 'image', normalizedType, meta: baseMeta };
  }

  if (normalizedType === 'image/svg+xml') {
    return {
      file,
      kind: 'image',
      normalizedType,
      meta: { ...baseMeta, reason: 'SVG kept as vector source.' },
    };
  }

  try {
    const sharpModule = await import('sharp');
    const sharpMod =
      (typeof sharpModule.default === 'function' ? sharpModule.default : sharpModule) as typeof import('sharp');
    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const image = sharpMod(sourceBuffer, { animated: true, failOn: 'none' });
    const metadata = await image.metadata();

    // Avoid flattening animation frames silently.
    if ((metadata.pages ?? 1) > 1) {
      return {
        file,
        kind: 'image',
        normalizedType,
        meta: { ...baseMeta, reason: 'Animated image kept in original format.' },
      };
    }

    const resized = image.rotate().resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    });

    const webpBuffer = await resized
      .webp({
        quality: Math.round(quality * 100),
        effort: 5,
      })
      .toBuffer();

    if (webpBuffer.length >= file.size) {
      return {
        file,
        kind: 'image',
        normalizedType,
        meta: {
          ...baseMeta,
          reason: 'Original file is smaller than converted WebP output.',
        },
      };
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
    const converted = new File([new Uint8Array(webpBuffer)], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    const reductionPct = Math.round(((file.size - webpBuffer.length) / file.size) * 100);
    return {
      file: converted,
      kind: 'image',
      normalizedType: 'image/webp',
      meta: {
        optimized: true,
        originalBytes: file.size,
        uploadedBytes: webpBuffer.length,
        reductionPct,
        originalType: normalizedType,
        uploadedType: 'image/webp',
      },
    };
  } catch (error) {
    const details = error instanceof Error ? ` (${error.message})` : '';
    return {
      file,
      kind: 'image',
      normalizedType,
      meta: {
        ...baseMeta,
        reason: `Could not optimize this image format; uploaded original.${details}`,
      },
    };
  }
}

export async function POST(request: Request) {
  const access = await requireStaff(
    ['admin', 'editor', 'reporter', 'translator', 'seo_editor', 'sports_reporter', 'local_correspondent'],
    request
  );
  if (!access.ok) return access.response;

  const form = await request.formData();
  const raw = form.get('file');
  if (!(raw instanceof File)) {
    return json({ ok: false, error: 'file is required as multipart/form-data.' }, 400);
  }
  const inferred = inferMedia(raw);
  if (!inferred.kind) {
    return json({ ok: false, error: 'Only image/* and video/* files are allowed.' }, 415);
  }
  if (raw.size > MAX_UPLOAD_BYTES) {
    return json(
      {
        ok: false,
        error: `File is too large (${Math.round(raw.size / (1024 * 1024))} MB). Max allowed is 25 MB.`,
      },
      413
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' }, 503);
  }

  const optimizeImagesToWebp = String(form.get('optimizeImagesToWebp') ?? 'true').toLowerCase() !== 'false';
  const qualityRaw = Number(form.get('webpQuality') ?? 0.82);
  const maxDimensionRaw = Number(form.get('maxImageDimension') ?? 2560);
  const webpQuality = Number.isFinite(qualityRaw) ? Math.max(0.55, Math.min(0.95, qualityRaw)) : 0.82;
  const maxImageDimension = Number.isFinite(maxDimensionRaw)
    ? Math.max(960, Math.min(4000, maxDimensionRaw))
    : 2560;

  const prepared =
    inferred.kind === 'image'
      ? await maybeOptimizeImageToWebp(raw, inferred.normalizedType, optimizeImagesToWebp, webpQuality, maxImageDimension)
      : {
          file: raw,
          kind: inferred.kind,
          normalizedType: inferred.normalizedType,
          meta: {
            optimized: false,
            originalBytes: raw.size,
            uploadedBytes: raw.size,
            reductionPct: 0,
            originalType: inferred.normalizedType,
            uploadedType: inferred.normalizedType,
            reason: 'Video files are stored in original format.',
          },
        };

  const safeName = prepared.file.name.replace(/[^A-Za-z0-9._-]/g, '-');
  const path = `${new Date().getFullYear()}/${Date.now()}-${safeName}`;
  const upload = await admin.storage.from('media').upload(path, prepared.file, {
    cacheControl: '3600',
    upsert: false,
    contentType: prepared.normalizedType || undefined,
  });
  if (upload.error) return json({ ok: false, error: upload.error.message ?? 'Storage upload failed.' }, 500);

  const { data: pub } = admin.storage.from('media').getPublicUrl(path);
  const row: Record<string, unknown> = {
    id: `media-${Date.now()}`,
    filename: prepared.file.name,
    url: pub.publicUrl,
    type: prepared.kind,
    size_bytes: prepared.file.size,
    size_label: formatBytes(prepared.file.size),
    uploaded_by: access.user.fullName,
    uploaded_at: new Date().toISOString(),
    alt_text: null,
    optimization_meta: prepared.meta,
  };
  const meta = prepared.meta;

  let insert = await admin.from('media_assets').insert(row).select('*').single();
  const missing = insert.error?.message?.match(/Could not find the '([^']+)' column/i)?.[1];
  if (insert.error && missing && missing in row) {
    delete row[missing];
    insert = await admin.from('media_assets').insert(row).select('*').single();
  }
  if (insert.error) return json({ ok: false, error: insert.error.message ?? 'Failed to record media asset.' }, 500);

  return json({ ok: true, data: insert.data as MediaAssetRow, meta }, 200);
}
