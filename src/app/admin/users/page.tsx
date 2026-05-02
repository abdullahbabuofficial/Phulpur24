'use client';

import { useEffect, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Input, Select } from '@/components/admin/ui/Input';
import { Avatar } from '@/components/admin/ui/Avatar';
import { Badge, StatusBadge } from '@/components/admin/ui/Badge';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { users as usersRepo } from '@/lib/supabase';
import type { ProfileRow } from '@/lib/supabase/types';

const roles: { value: ProfileRow['role']; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'translator', label: 'Translator' },
  { value: 'seo_editor', label: 'SEO Editor' },
  { value: 'sports_reporter', label: 'Sports Reporter' },
  { value: 'local_correspondent', label: 'Local Correspondent' },
];

const rolePermissions: { role: ProfileRow['role']; perms: string[]; tone: 'danger' | 'info' | 'success' | 'accent' | 'warning' }[] = [
  { role: 'admin', perms: ['Full control over all settings and users'], tone: 'danger' },
  { role: 'editor', perms: ['Publish & edit any post', 'Manage authors', 'Approve translations'], tone: 'info' },
  { role: 'reporter', perms: ['Create & edit own posts', 'Submit for review'], tone: 'success' },
  { role: 'translator', perms: ['Translate posts', 'Read-only on others'], tone: 'accent' },
  { role: 'seo_editor', perms: ['Edit SEO metadata', 'View analytics'], tone: 'warning' },
  { role: 'sports_reporter', perms: ['Sports beats', 'Create & submit posts'], tone: 'success' },
  { role: 'local_correspondent', perms: ['Local beats', 'Create & submit posts'], tone: 'success' },
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UsersPage() {
  const { push } = useToast();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProfileRow['role']>('reporter');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<ProfileRow['role']>('reporter');
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    const res = await usersRepo.listUsers();
    setUsers(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleInvite = async () => {
    setError('');
    const email = inviteEmail.trim().toLowerCase();
    if (!emailRe.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? `Invite failed (${res.status}).`);
        return;
      }
      push({
        tone: 'success',
        title: 'Invitation sent',
        description: `${email} will receive a Supabase email to set a password.`,
      });
      setInviteEmail('');
      reload();
    } catch {
      setError('Network error — try again.');
    }
  };

  const startEdit = (u: ProfileRow) => {
    setError('');
    setEditingId(u.id);
    setEditName(u.full_name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setError('');
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    if (!name) return setError('Name is required.');
    if (!emailRe.test(email)) return setError('Enter a valid email address.');
    const res = await usersRepo.updateUser(editingId, { full_name: name, email, role: editRole });
    if (res.error) {
      setError(res.error.message);
      return;
    }
    push({ tone: 'success', title: 'User updated' });
    setEditingId(null);
    reload();
  };

  const handleRemove = async (u: ProfileRow) => {
    if (!confirm(`Remove ${u.full_name} from the workspace?`)) return;
    const res = await usersRepo.removeUser(u.id);
    if (res.error) {
      push({ tone: 'error', title: res.error.message });
      return;
    }
    push({ tone: 'success', title: 'User removed' });
    if (editingId === u.id) setEditingId(null);
    reload();
  };

  return (
    <AdminPageShell title="Users & Roles">
      <PageHeader
        title="Users & Roles"
        description="Invite teammates, assign roles, and manage workspace access."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Users' }]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-base font-semibold text-ink">Team members</p>
              <p className="text-xs text-ink-muted">{users.length} total · {users.filter((u) => u.status === 'active').length} active</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => document.getElementById('invite-email')?.focus()}
              iconLeft={<Icon.Plus size={14} />}
            >
              Invite
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-left font-medium">Articles</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="skeleton h-4 w-full rounded-md" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : users.map((u) => (
                      <tr
                        key={u.id}
                        className={`transition-colors ${editingId === u.id ? 'bg-accent-soft/40' : 'hover:bg-app'}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.full_name} src={u.avatar_url} size="md" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">{u.full_name}</p>
                              <p className="text-xs text-ink-muted">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone="accent">{roles.find((r) => r.value === u.role)?.label ?? u.role}</Badge>
                        </td>
                        <td className="px-5 py-3 text-ink-muted">{u.articles_count}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => startEdit(u)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-app hover:text-ink"
                              aria-label="Edit"
                            >
                              <Icon.Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleRemove(u)}
                              disabled={
                                u.role === 'admin' &&
                                users.filter((x) => x.role === 'admin').length <= 1
                              }
                              title={
                                u.role === 'admin' &&
                                users.filter((x) => x.role === 'admin').length <= 1
                                  ? 'Promote another admin before removing this account.'
                                  : undefined
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Remove"
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

        <div className="space-y-4">
          <Card padded>
            <CardHeader
              title={editingId ? 'Edit user' : 'Invite teammate'}
              subtitle={
                editingId
                  ? undefined
                  : 'Sends a Supabase Auth email · requires SUPABASE_SERVICE_ROLE_KEY on the server.'
              }
            />
            {error ? (
              <div className="mt-3 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger-text">
                {error}
              </div>
            ) : null}
            {editingId ? (
              <div className="mt-4 space-y-3">
                <Input label="Full name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                <Select label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value as ProfileRow['role'])}>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSave} fullWidth>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <Input
                  id="invite-email"
                  label="Email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  iconLeft={<Icon.Mail size={16} />}
                  placeholder="name@phulpur24.com"
                />
                <Select label="Role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as ProfileRow['role'])}>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                <Button onClick={handleInvite} fullWidth iconLeft={<Icon.Plus size={14} />}>
                  Send invitation
                </Button>
              </div>
            )}
          </Card>

          <Card padded>
            <CardHeader title="Roles & permissions" subtitle="Edit policies in Supabase RLS later." />
            <ul className="mt-4 space-y-3">
              {rolePermissions.map((p) => (
                <li key={p.role} className="rounded-xl border border-line p-3">
                  <Badge tone={p.tone}>{roles.find((r) => r.value === p.role)?.label}</Badge>
                  <p className="mt-1.5 text-xs text-ink-muted">{p.perms.join(' · ')}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AdminPageShell>
  );
}
