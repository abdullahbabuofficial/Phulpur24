'use client';

import { useEffect, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Input, Select, Textarea } from '@/components/admin/ui/Input';
import { Switch } from '@/components/admin/ui/Switch';
import { Button } from '@/components/admin/ui/Button';
import { Tabs } from '@/components/admin/ui/Tabs';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { settings as settingsRepo } from '@/lib/supabase';
import type { SiteSettingsRow } from '@/lib/supabase/types';
import { setSiteConfig, DEFAULT_SITE_CONFIG } from '@/lib/site-config';

const TABS = ['general', 'seo', 'social', 'ads', 'features', 'danger'] as const;
type Tab = (typeof TABS)[number];
const tabLabels: Record<Tab, string> = {
  general: 'General',
  seo: 'SEO',
  social: 'Social',
  ads: 'Ads',
  features: 'Features',
  danger: 'Danger zone',
};

export default function SettingsPage() {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>('general');
  const [s, setS] = useState<SiteSettingsRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsRepo.getSettings().then((res) => {
      setS(res.data!);
    });
  }, []);

  if (!s) {
    return (
      <AdminPageShell title="Settings">
        <PageHeader title="Site settings" />
        <Card>
          <div className="skeleton h-32 w-full rounded-md" />
        </Card>
      </AdminPageShell>
    );
  }

  const update = <K extends keyof SiteSettingsRow>(k: K, v: SiteSettingsRow[K]) =>
    setS((cur) => (cur ? { ...cur, [k]: v } : cur));

  const updateSocial = (k: keyof SiteSettingsRow['social'], v: string) =>
    setS((cur) => (cur ? { ...cur, social: { ...cur.social, [k]: v } } : cur));

  const updateContact = (k: keyof SiteSettingsRow['contact'], v: string) =>
    setS((cur) => (cur ? { ...cur, contact: { ...cur.contact, [k]: v } } : cur));

  const handleSave = async () => {
    setSaving(true);
    const res = await settingsRepo.updateSettings(s);
    // Mirror to public site-config so the front-of-house follows along
    setSiteConfig({
      siteName: s.site_name,
      siteUrl: s.site_url,
      defaultLanguage: s.default_language,
      taglineBn: s.tagline_bn,
      taglineEn: s.tagline_en,
      descriptionBn: s.description_bn,
      descriptionEn: s.description_en,
      seo: {
        metaTitleSuffix: s.meta_title_suffix,
        metaDescription: s.meta_description,
        enableSitemap: s.enable_sitemap,
      },
      social: {
        facebook: s.social.facebook,
        twitter: s.social.twitter,
        youtube: s.social.youtube,
        instagram: s.social.instagram,
      },
      contact: {
        email: s.contact.email,
        phone: s.contact.phone,
        addressBn: s.contact.address_bn,
        addressEn: s.contact.address_en,
        hoursBn: s.contact.hours_bn ?? DEFAULT_SITE_CONFIG.contact.hoursBn,
        hoursEn: s.contact.hours_en ?? DEFAULT_SITE_CONFIG.contact.hoursEn,
      },
      features: {
        enableAds: s.enable_ads,
        enableNewsletter: s.enable_newsletter,
        enableComments: s.enable_comments,
      },
      ads: { adsenseId: s.adsense_id },
    });
    setSaving(false);
    push({ tone: 'success', title: 'Settings saved', description: 'Public site updated to match.' });
    void res;
  };

  return (
    <AdminPageShell title="Settings">
      <PageHeader
        title="Site settings"
        description="Update branding, SEO, social links, and feature flags. Changes propagate to the public site."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Settings' }]}
        actions={
          <Button onClick={handleSave} loading={saving} iconLeft={<Icon.Check size={14} />}>
            Save changes
          </Button>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-line px-5 pt-3">
          <Tabs<Tab> tabs={TABS.map((id) => ({ id, label: tabLabels[id] }))} active={tab} onChange={setTab} />
        </div>

        <div className="p-5 sm:p-6">
          {tab === 'general' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input label="Site name" value={s.site_name} onChange={(e) => update('site_name', e.target.value)} />
              <Input label="Site URL" type="url" value={s.site_url} onChange={(e) => update('site_url', e.target.value)} />
              <Input label="Tagline (Bangla)" value={s.tagline_bn} onChange={(e) => update('tagline_bn', e.target.value)} langClass="font-bangla" />
              <Input label="Tagline (English)" value={s.tagline_en} onChange={(e) => update('tagline_en', e.target.value)} />
              <Select label="Default language" value={s.default_language} onChange={(e) => update('default_language', e.target.value as 'bn' | 'en')}>
                <option value="bn">Bangla (বাংলা)</option>
                <option value="en">English</option>
              </Select>
              <Input label="Contact email" type="email" value={s.contact.email} onChange={(e) => updateContact('email', e.target.value)} />
              <Input label="Contact phone" value={s.contact.phone} onChange={(e) => updateContact('phone', e.target.value)} />
              <Input label="Address (English)" value={s.contact.address_en} onChange={(e) => updateContact('address_en', e.target.value)} />
              <Input label="Address (Bangla)" value={s.contact.address_bn} onChange={(e) => updateContact('address_bn', e.target.value)} langClass="font-bangla" />
              <Input label="Hours (Bangla)" value={s.contact.hours_bn ?? ''} onChange={(e) => updateContact('hours_bn', e.target.value)} langClass="font-bangla" hint="Shown on contact page (Bangla)." />
              <Input label="Hours (English)" value={s.contact.hours_en ?? ''} onChange={(e) => updateContact('hours_en', e.target.value)} hint="Shown on contact page (English)." />
            </div>
          ) : null}

          {tab === 'seo' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input
                label="Meta title suffix"
                value={s.meta_title_suffix}
                onChange={(e) => update('meta_title_suffix', e.target.value)}
                hint="Appended to article titles in <title> tags."
              />
              <div className="lg:col-span-2">
                <Textarea
                  label="Default meta description"
                  rows={3}
                  value={s.meta_description}
                  onChange={(e) => update('meta_description', e.target.value)}
                />
              </div>
              <div className="lg:col-span-2 rounded-xl border border-line p-4">
                <Switch
                  checked={s.enable_sitemap}
                  onChange={(v) => update('enable_sitemap', v)}
                  label="Generate sitemap.xml"
                  description="Updated automatically when articles publish."
                />
              </div>
            </div>
          ) : null}

          {tab === 'social' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input label="Facebook" value={s.social.facebook} onChange={(e) => updateSocial('facebook', e.target.value)} placeholder="https://facebook.com/phulpur24" />
              <Input label="Twitter / X" value={s.social.twitter} onChange={(e) => updateSocial('twitter', e.target.value)} placeholder="https://twitter.com/phulpur24" />
              <Input label="YouTube" value={s.social.youtube} onChange={(e) => updateSocial('youtube', e.target.value)} placeholder="https://youtube.com/@phulpur24" />
              <Input label="Instagram" value={s.social.instagram} onChange={(e) => updateSocial('instagram', e.target.value)} placeholder="https://instagram.com/phulpur24" />
            </div>
          ) : null}

          {tab === 'ads' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2 rounded-xl border border-line p-4">
                <Switch checked={s.enable_ads} onChange={(v) => update('enable_ads', v)} label="Enable advertisements" description="Show ad slots across the public site." />
              </div>
              <Input label="Google AdSense ID" value={s.adsense_id} onChange={(e) => update('adsense_id', e.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
            </div>
          ) : null}

          {tab === 'features' ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-line p-4">
                <Switch checked={s.enable_newsletter} onChange={(v) => update('enable_newsletter', v)} label="Newsletter signup" description="Show the newsletter signup form on article pages." />
              </div>
              <div className="rounded-xl border border-line p-4">
                <Switch checked={s.enable_comments} onChange={(v) => update('enable_comments', v)} label="Comments" description="Allow readers to comment on articles." />
              </div>
              <div className="rounded-xl border border-line p-4">
                <Switch checked={s.enable_ads} onChange={(v) => update('enable_ads', v)} label="Ads" description="Display the configured ad slots." />
              </div>
              <div className="rounded-xl border border-line p-4">
                <Switch checked={s.enable_sitemap} onChange={(v) => update('enable_sitemap', v)} label="Sitemap" description="Auto-publish sitemap.xml." />
              </div>
            </div>
          ) : null}

          {tab === 'danger' ? (
            <div className="space-y-3">
              <Card padded className="border-danger/30">
                <CardHeader
                  title="Reset settings to defaults"
                  subtitle="This will revert site name, taglines, SEO defaults, and integrations."
                />
                <Button
                  variant="danger"
                  className="mt-3"
                  onClick={async () => {
                    if (!confirm('Reset all site settings to defaults? This cannot be undone.')) return;
                    const fresh = await settingsRepo.updateSettings({});
                    setS(fresh.data!);
                    push({ tone: 'success', title: 'Settings reset' });
                  }}
                >
                  Reset to defaults
                </Button>
              </Card>
              <Card padded className="border-danger/30">
                <CardHeader
                  title="Clear local cache"
                  subtitle="Removes the locally-stored copy used by the public site."
                />
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    localStorage.removeItem('phulpur24:siteConfig');
                    push({ tone: 'success', title: 'Local cache cleared' });
                  }}
                >
                  Clear cache
                </Button>
              </Card>
            </div>
          ) : null}
        </div>
      </Card>
    </AdminPageShell>
  );
}
