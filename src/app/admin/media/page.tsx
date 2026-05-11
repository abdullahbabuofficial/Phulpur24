'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Input, Select } from '@/components/admin/ui/Input';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Tabs } from '@/components/admin/ui/Tabs';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { media as mediaRepo } from '@/lib/supabase';
import type { MediaAssetRow, MediaType } from '@/lib/supabase/types';

type View = 'grid' | 'list';

export default function MediaPage() {
  const { push } = useToast();
  const [view, setView] = useState<View>('grid');
  const [assets, setAssets] = useState<MediaAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<MediaType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    const res = await mediaRepo.listMedia({ search, type });
    setAssets(res.data ?? []);
    setLoading(false);
    if (!selectedId && res.data?.length) setSelectedId(res.data[0].id);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type]);

  const selected = useMemo(() => assets.find((a) => a.id === selectedId) ?? null, [assets, selectedId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    let fail = 0;
    let optimizedCount = 0;
    let lastNewId: string | null = null;

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      form.append('optimizeImagesToWebp', 'true');
      form.append('webpQuality', '0.82');
      form.append('maxImageDimension', '2560');
      const uploadRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const upload = (await uploadRes.json()) as {
        ok: boolean;
        data?: MediaAssetRow;
        meta?: { optimized?: boolean };
        error?: string;
      };
      if (!uploadRes.ok || !upload.ok || !upload.data) {
        fail++;
        push({
          tone: 'error',
          title: file.name,
          description: upload.error ?? 'Upload failed',
        });
      } else {
        ok++;
        if (upload.meta?.optimized) optimizedCount++;
        lastNewId = upload.data.id;
      }
    }

    setUploading(false);
    if (ok > 0) {
      push({
        tone: 'success',
        title: `${ok} file${ok === 1 ? '' : 's'} uploaded to storage`,
        description:
          fail > 0
            ? `${fail} failed - see toasts above.`
            : optimizedCount > 0
            ? `${optimizedCount} image${optimizedCount === 1 ? '' : 's'} optimized automatically.`
            : 'Public URLs are ready to paste into posts.',
      });
    }
    if (lastNewId) setSelectedId(lastNewId);
    if (fileInput.current) fileInput.current.value = '';
    reload();
  };

  const handleCopy = async (asset: MediaAssetRow) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      push({ tone: 'success', title: 'Copied URL', description: asset.filename });
    } catch {
      push({ tone: 'info', title: 'URL ready', description: asset.url });
    }
  };

  const handleDelete = async (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    if (!confirm(`Delete ${asset.filename}?`)) return;
    await mediaRepo.deleteMedia(id);
    if (selectedId === id) setSelectedId(null);
    push({ tone: 'success', title: 'Deleted' });
    reload();
  };

  return (
    <AdminPageShell title="Media">
      <PageHeader
        title="Media library"
        description="Upload, browse, and reuse images and videos across articles."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Media' }]}
        actions={
          <Button
            iconLeft={<Icon.Upload size={14} />}
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload files'}
          </Button>
        }
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        aria-label="Upload media"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* Toolbar */}
          <Card padded={false}>
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1 min-w-[200px] max-w-md">
                <Input
                  placeholder="Search filename, uploader, date…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  iconLeft={<Icon.Search size={16} />}
                />
              </div>
              <Select value={type} onChange={(e) => setType(e.target.value as MediaType | 'all')} className="w-36" aria-label="Media type">
                <option value="all">All types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </Select>
              <Tabs<View>
                tabs={[
                  { id: 'grid', label: 'Grid', icon: <Icon.GridIcon size={14} /> },
                  { id: 'list', label: 'List', icon: <Icon.ListIcon size={14} /> },
                ]}
                active={view}
                onChange={setView}
                variant="pills"
              />
            </div>
          </Card>

          {/* Drop zone */}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
              drag ? 'border-accent bg-accent-soft' : 'border-line bg-white hover:border-accent/40'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon.Upload size={18} />
            </span>
            <p className="text-sm font-medium text-ink">Drop files here, or click to browse</p>
            <p className="text-xs text-ink-muted">
              JPG, PNG, GIF, WebP, MP4 · stored in Supabase Storage (`media` bucket)
            </p>
          </button>

          {/* Assets */}
          {loading ? (
            <div className={`grid gap-3 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`skeleton rounded-xl ${view === 'grid' ? 'aspect-square' : 'h-16'}`} />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState
              icon={<Icon.Image size={20} />}
              title="No media yet"
              description="Upload your first asset to get started."
              action={
                <Button onClick={() => fileInput.current?.click()} iconLeft={<Icon.Upload size={14} />}>
                  Upload files
                </Button>
              }
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {assets.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border bg-white transition ${
                    selectedId === a.id ? 'border-accent ring-2 ring-accent/30' : 'border-line hover:border-accent/30'
                  }`}
                >
                  {a.type === 'image' ? (
                    <img src={a.url} alt={a.filename} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-ink text-white">
                      <Icon.Sparkles size={20} /> Video
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-2 text-left">
                    <p className="line-clamp-1 text-xs font-medium text-white">{a.filename}</p>
                    <p className="text-[10px] text-white/70">{a.size_label}</p>
                  </div>
                  {selectedId === a.id ? (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                      <Icon.Check size={12} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                      <th className="px-4 py-3 text-left font-medium">File</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Size</th>
                      <th className="px-4 py-3 text-left font-medium">Uploaded</th>
                      <th className="px-4 py-3 text-left font-medium">By</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {assets.map((a) => (
                      <tr
                        key={a.id}
                        className={`transition-colors ${selectedId === a.id ? 'bg-accent-soft/40' : 'hover:bg-app'}`}
                      >
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => setSelectedId(a.id)} className="flex items-center gap-3 text-left">
                            {a.type === 'image' ? (
                              <img src={a.url} alt="" className="h-9 w-12 rounded-md object-cover" />
                            ) : (
                              <span className="flex h-9 w-12 items-center justify-center rounded-md bg-ink text-white text-[10px]">VIDEO</span>
                            )}
                            <span className="text-sm text-ink">{a.filename}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs uppercase text-ink-muted">{a.type}</td>
                        <td className="px-4 py-3 text-ink-muted">{a.size_label}</td>
                        <td className="px-4 py-3 text-ink-muted">{a.uploaded_at}</td>
                        <td className="px-4 py-3 text-ink-muted">{a.uploaded_by}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleCopy(a)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-app hover:text-ink"
                              aria-label="Copy URL"
                            >
                              <Icon.Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
                              aria-label="Delete"
                            >
                              <Icon.Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Detail panel */}
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Asset details</p>
            {selected ? (
              <button onClick={() => setSelectedId(null)} className="text-xs text-ink-muted hover:text-ink">
                Close
              </button>
            ) : null}
          </div>
          {selected ? (
            <div className="p-4">
              <div className="aspect-video overflow-hidden rounded-lg bg-app">
                {selected.type === 'image' ? (
                  <img src={selected.url} alt={selected.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-muted">Video preview</div>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="break-all text-sm font-medium text-ink">{selected.filename}</p>
                <p className="text-xs text-ink-muted">
                  {selected.type.toUpperCase()} · {selected.size_label}
                </p>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Uploaded</dt>
                  <dd className="text-ink">{selected.uploaded_at}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">By</dt>
                  <dd className="text-ink">{selected.uploaded_by}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => handleCopy(selected)} variant="secondary" iconLeft={<Icon.Copy size={14} />}>
                  Copy URL
                </Button>
                <Button onClick={() => handleDelete(selected.id)} variant="danger" iconLeft={<Icon.Trash size={14} />}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Icon.Image size={18} />}
              title="No asset selected"
              description="Pick an image or video to see details."
            />
          )}
        </Card>
      </div>
    </AdminPageShell>
  );
}
