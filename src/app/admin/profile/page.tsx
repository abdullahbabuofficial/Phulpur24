'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceContext';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Avatar } from '@/components/admin/ui/Avatar';
import { Badge, StatusBadge } from '@/components/admin/ui/Badge';
import { Input } from '@/components/admin/ui/Input';
import { Switch } from '@/components/admin/ui/Switch';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { supabase } from '@/lib/supabase/client';
import { audit as auditRepo, users as usersRepo } from '@/lib/supabase';
import { staffRoleLabel } from '@/lib/admin-rbac';
import type { AuditLogRow } from '@/lib/supabase/types';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREFS_KEY = 'phulpur24.admin.profile.prefs';

type ProfilePrefs = {
  compactEditor: boolean;
  browserNotifications: boolean;
  emailDigests: boolean;
};

const roleFeatures: Record<string, string[]> = {
  admin: ['Full workspace administration', 'User and role governance', 'All publish and settings permissions'],
  editor: ['Cross-desk publishing rights', 'Content review workflow', 'SEO and translation collaboration'],
  reporter: ['Create and update own stories', 'Submit to review queue', 'Media and draft workflow'],
  translator: ['Translation queue management', 'Bangla-English parity checks', 'Editorial handoff support'],
  seo_editor: ['Metadata and snippet optimization', 'SEO scoring and audits', 'Visibility issue triage'],
  sports_reporter: ['Sports desk content workflow', 'Fast publish during events', 'Media-assisted reporting'],
  local_correspondent: ['Local coverage publishing flow', 'Community beat updates', 'Desk collaboration'],
};

export default function ProfilePage() {
  const { push } = useToast();
  const { profile, refreshProfile } = useAdminWorkspace();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const avatarUploadInputRef = useRef<HTMLInputElement | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [prefs, setPrefs] = useState<ProfilePrefs>({
    compactEditor: false,
    browserNotifications: false,
    emailDigests: true,
  });
  const [activity, setActivity] = useState<AuditLogRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const roleLabel = useMemo(() => staffRoleLabel(profile?.role ?? null), [profile?.role]);
  const roleFeatureList = useMemo(() => roleFeatures[profile?.role ?? ''] ?? ['Workspace member access'], [profile?.role]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setEmail(profile.email || '');
    setAvatarUrl(profile.avatar_url || '');
  }, [profile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<ProfilePrefs>;
      setPrefs((p) => ({
        compactEditor: parsed.compactEditor ?? p.compactEditor,
        browserNotifications: parsed.browserNotifications ?? p.browserNotifications,
        emailDigests: parsed.emailDigests ?? p.emailDigests,
      }));
    } catch {
      // ignore invalid local preference payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const run = async () => {
      setLoadingActivity(true);
      const res = await auditRepo.recentAudit(80);
      const rows = res.data ?? [];
      const emailNeedle = profile?.email?.toLowerCase().trim() ?? '';
      const nameNeedle = profile?.full_name?.toLowerCase().trim() ?? '';
      const mine = rows.filter((row) => {
        const actor = row.user_name.toLowerCase();
        const target = row.target.toLowerCase();
        if (nameNeedle && actor === nameNeedle) return true;
        if (emailNeedle && target.includes(emailNeedle)) return true;
        return false;
      });
      setActivity((mine.length ? mine : rows).slice(0, 12));
      setLoadingActivity(false);
    };
    void run();
  }, [profile?.email, profile?.full_name]);

  const handleSaveIdentity = async () => {
    if (!profile) return;
    const name = fullName.trim();
    const nextEmail = email.trim().toLowerCase();
    if (!name) {
      push({ tone: 'warning', title: 'Name is required' });
      return;
    }
    if (!emailRe.test(nextEmail)) {
      push({ tone: 'warning', title: 'Valid email is required' });
      return;
    }
    setSavingIdentity(true);
    const res = await usersRepo.updateUser(profile.id, {
      full_name: name,
      email: nextEmail,
      avatar_url: avatarUrl.trim() || null,
    });
    setSavingIdentity(false);
    if (res.error) {
      push({ tone: 'error', title: 'Profile update failed', description: res.error.message });
      return;
    }
    await refreshProfile();
    push({ tone: 'success', title: 'Profile updated' });
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('optimizeImagesToWebp', 'true');
      form.append('webpQuality', '0.82');
      form.append('maxImageDimension', '1024');

      const uploadRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const payload = (await uploadRes.json()) as {
        ok: boolean;
        error?: string;
        data?: { url: string };
        meta?: { optimized?: boolean; reductionPct?: number };
      };
      if (!uploadRes.ok || !payload.ok || !payload.data?.url) {
        throw new Error(payload.error ?? 'Upload failed');
      }
      setAvatarUrl(payload.data.url);
      const reduction = payload.meta?.reductionPct;
      push({
        tone: 'success',
        title: payload.meta?.optimized ? 'Avatar uploaded and optimized' : 'Avatar uploaded',
        description:
          typeof reduction === 'number' && reduction > 0
            ? `Compressed by about ${reduction}%. Save profile to apply it.`
            : 'Save profile to apply this avatar.',
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Upload failed';
      push({ tone: 'error', title: 'Avatar upload failed', description });
    } finally {
      setAvatarUploading(false);
      if (avatarUploadInputRef.current) avatarUploadInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      push({ tone: 'warning', title: 'New password is required' });
      return;
    }
    if (newPassword.length < 8) {
      push({ tone: 'warning', title: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      push({ tone: 'warning', title: 'Passwords do not match' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      push({ tone: 'error', title: 'Password update failed', description: error.message });
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    push({ tone: 'success', title: 'Password updated' });
  };

  return (
    <AdminPageShell title="My Profile">
      <PageHeader
        title="My Profile"
        description="Manage your account identity, security, and workspace preferences."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Profile' }]}
        actions={
          <Link href="/admin/users">
            <Button variant="secondary" size="sm" iconLeft={<Icon.Users size={14} />}>
              Users & Roles
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card padded>
            <CardHeader title="Profile Identity" subtitle="Keep your public newsroom identity current." />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[9rem_minmax(0,1fr)]">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-app p-3">
                <Avatar name={fullName || profile?.full_name || 'User'} src={avatarUrl || profile?.avatar_url} size="lg" />
                <p className="text-[11px] text-ink-muted">Live preview</p>
                <input
                  ref={avatarUploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarUpload(file);
                  }}
                  aria-label="Upload profile avatar"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  loading={avatarUploading}
                  iconLeft={<Icon.Upload size={14} />}
                  onClick={() => avatarUploadInputRef.current?.click()}
                >
                  {avatarUploading ? 'Uploading...' : 'Upload avatar'}
                </Button>
              </div>
              <div className="space-y-3">
                <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input
                  label="Avatar URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://cdn.example.com/avatar.jpg"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={handleSaveIdentity} loading={savingIdentity} iconLeft={<Icon.Check size={14} />}>
                    Save profile
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFullName(profile?.full_name ?? '');
                      setEmail(profile?.email ?? '');
                      setAvatarUrl(profile?.avatar_url ?? '');
                    }}
                  >
                    Reset changes
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card padded>
            <CardHeader title="Security" subtitle="Update your account password." />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={handleChangePassword} loading={savingPassword} iconLeft={<Icon.Lock size={14} />}>
                Update password
              </Button>
              <Button variant="ghost" onClick={() => void supabase.auth.signOut()} iconLeft={<Icon.SignOut size={14} />}>
                Sign out this session
              </Button>
            </div>
          </Card>

          <Card padded>
            <CardHeader title="Preferences" subtitle="Personalize your admin workspace behavior." />
            <div className="mt-4 space-y-3">
              <Switch
                label="Compact editor mode"
                description="Prefer denser spacing in long-form editing sections."
                checked={prefs.compactEditor}
                onChange={(next) => setPrefs((p) => ({ ...p, compactEditor: next }))}
              />
              <Switch
                label="Browser notifications"
                description="Enable in-browser reminder notifications for pending tasks."
                checked={prefs.browserNotifications}
                onChange={(next) => setPrefs((p) => ({ ...p, browserNotifications: next }))}
              />
              <Switch
                label="Email digests"
                description="Receive periodic editorial summaries by email."
                checked={prefs.emailDigests}
                onChange={(next) => setPrefs((p) => ({ ...p, emailDigests: next }))}
              />
            </div>
          </Card>

          <Card padded>
            <CardHeader title="Recent Activity" subtitle="Your latest account-related actions." />
            <div className="mt-4 space-y-2">
              {loadingActivity ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-app px-3 py-5 text-center text-sm text-ink-muted">
                  No profile activity yet.
                </p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="rounded-lg border border-line bg-white px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{item.action}</p>
                      <p className="text-[11px] text-ink-muted">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">{item.target}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card padded>
            <CardHeader title="Account Summary" />
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Role</span>
                <Badge tone="accent">{roleLabel}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Status</span>
                <StatusBadge status={profile?.status ?? 'active'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Published count</span>
                <span className="font-medium text-ink">{profile?.articles_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Last seen</span>
                <span className="text-xs text-ink">{profile?.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : 'n/a'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Joined</span>
                <span className="text-xs text-ink">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'n/a'}</span>
              </div>
            </div>
          </Card>

          <Card padded>
            <CardHeader title="Role Capabilities" subtitle="What this account can do." />
            <ul className="mt-3 space-y-2 text-xs text-ink-muted">
              {roleFeatureList.map((item) => (
                <li key={item} className="rounded-md border border-line bg-app px-2.5 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </AdminPageShell>
  );
}
