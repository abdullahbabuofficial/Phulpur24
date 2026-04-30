import { supabase } from '../client';
import { logAction } from './audit';
import type { MediaAssetRow, MediaType } from '../types';

export interface ListMediaParams {
  search?: string;
  type?: MediaType | 'all';
}

export async function listMedia(params: ListMediaParams = {}) {
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

export async function uploadMedia(
  files: { filename: string; url: string; type: MediaType; size_bytes: number }[]
) {
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
  const { error } = await supabase.from('media_assets').delete().eq('id', id);
  if (!error) void logAction('Deleted media', id, 'Admin', 'image');
  return { data: !error, error };
}

/**
 * Upload a real File to the `media` storage bucket and persist a row.
 */
export async function uploadFileToStorage(file: File): Promise<{ data: MediaAssetRow | null; error: { message: string } | null }> {
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
  const path = `${new Date().getFullYear()}/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) return { data: null, error: { message: upErr.message ?? 'Upload failed.' } };
  const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
  const row: Omit<MediaAssetRow, 'id'> & { id: string } = {
    id: `media-${Date.now()}`,
    filename: file.name,
    url: pub.publicUrl,
    type: file.type.startsWith('video') ? 'video' : 'image',
    size_bytes: file.size,
    size_label: formatBytes(file.size),
    uploaded_by: 'Admin',
    uploaded_at: new Date().toISOString(),
    alt_text: null,
  };
  const { data, error } = await supabase.from('media_assets').insert(row).select('*').single();
  if (error) return { data: null, error: { message: error.message ?? 'Failed to record asset.' } };
  void logAction('Uploaded media', file.name, 'Admin', 'image');
  return { data: data as MediaAssetRow, error: null };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
