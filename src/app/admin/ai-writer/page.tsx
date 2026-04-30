'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Input } from '@/components/admin/ui/Input';
import { Button } from '@/components/admin/ui/Button';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';

type LanguageMode = 'bn' | 'en' | 'both';
const tones = ['Neutral', 'Formal', 'Casual', 'Informative', 'Persuasive'] as const;
type Tone = (typeof tones)[number];

const toneGuidance: Record<Tone, { bn: string; en: string }> = {
  Neutral: {
    bn: 'নিরপেক্ষ ভাষায় তথ্যগুলো তুলে ধরা হয়েছে।',
    en: 'The report presents the facts in a balanced voice.',
  },
  Formal: {
    bn: 'প্রতিবেদনটি আনুষ্ঠানিক ভাষা ও নির্ভরযোগ্য সূত্রের ওপর গুরুত্ব দিয়েছে।',
    en: 'The draft uses a formal tone with emphasis on credible sourcing.',
  },
  Casual: {
    bn: 'সহজ ভাষায় পাঠকের কাছে বিষয়টি ব্যাখ্যা করা হয়েছে।',
    en: 'The story explains the update in a simple, reader-friendly style.',
  },
  Informative: {
    bn: 'পটভূমি, প্রভাব ও পরবর্তী পদক্ষেপ আলাদা করে ব্যাখ্যা করা হয়েছে।',
    en: 'Background, impact, and next steps are explained clearly.',
  },
  Persuasive: {
    bn: 'স্থানীয় স্বার্থ ও প্রয়োজনীয়তার দিকটি জোর দিয়ে তুলে ধরা হয়েছে।',
    en: 'The draft highlights the local importance and public value of the story.',
  },
};

function buildBn(topic: string, kw: string, tone: Tone) {
  return `ফুলপুরে ${topic} নিয়ে বিস্তারিত প্রতিবেদন

ফুলপুর উপজেলায় ${topic} সংক্রান্ত একটি গুরুত্বপূর্ণ অগ্রগতি হয়েছে। ${toneGuidance[tone].bn} ${kw ? `মূল বিষয়গুলোর মধ্যে রয়েছে ${kw}।` : ''}

স্থানীয় প্রশাসন জানিয়েছে, বিষয়টি নিয়ে সংশ্লিষ্ট দপ্তরগুলো সমন্বিতভাবে কাজ করছে। নাগরিক সেবা, নিরাপত্তা এবং দীর্ঘমেয়াদি উন্নয়নের দিক বিবেচনায় পরবর্তী পদক্ষেপ নেওয়া হবে।

স্থানীয় বাসিন্দারা আশা করছেন, এই উদ্যোগ দ্রুত বাস্তবায়ন হলে এলাকার মানুষ সরাসরি উপকৃত হবেন।`;
}

function buildEn(topic: string, kw: string, tone: Tone) {
  return `Comprehensive report on ${topic} in Phulpur

A significant development regarding ${topic} has occurred in Phulpur upazila. ${toneGuidance[tone].en} ${kw ? `Key angles include ${kw}.` : ''}

Local administration said relevant offices are working in coordination on the matter. Next steps will consider public service, safety, and long-term development needs.

Residents hope the initiative will move quickly and bring direct benefits to the community.`;
}

export default function AIWriterPage() {
  const { push } = useToast();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState<Tone>('Neutral');
  const [lang, setLang] = useState<LanguageMode>('bn');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');

  const wordCount = useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), keywords: keywords.trim(), tone, language: lang }),
      });
      const json = (await res.json()) as { ok: boolean; draft?: string; mode?: string; error?: string };
      if (!json.ok || !json.draft) {
        throw new Error(json.error ?? 'Generation failed');
      }
      setDraft(json.draft);
      push({
        tone: 'success',
        title: json.mode === 'live' ? 'Draft generated (Claude)' : 'Draft generated (template)',
        description: json.mode === 'fallback' ? 'Set ANTHROPIC_API_KEY in .env.local for real AI output.' : undefined,
      });
    } catch (err) {
      // Fallback to client-side templates if the route itself fails.
      const t = topic.trim();
      const k = keywords.trim();
      const drafts = { bn: buildBn(t, k, tone), en: buildEn(t, k, tone) };
      setDraft(
        lang === 'both'
          ? `বাংলা খসড়া\n\n${drafts.bn}\n\n---\n\nEnglish Draft\n\n${drafts.en}`
          : drafts[lang]
      );
      push({ tone: 'warning', title: 'Used fallback template', description: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  };

  const useInEditor = () => {
    const t = topic.trim() || 'Untitled draft';
    const titleEn = lang === 'bn' ? '' : `${t} in Phulpur`;
    const titleBn = lang === 'en' ? '' : `ফুলপুরে ${t}`;
    const bodyEn = lang === 'bn' ? '' : buildEn(t, keywords.trim(), tone);
    const bodyBn = lang === 'en' ? '' : buildBn(t, keywords.trim(), tone);
    localStorage.setItem(
      'phulpur24.aiDraft',
      JSON.stringify({
        title_en: titleEn,
        title_bn: titleBn,
        body_en: bodyEn,
        body_bn: bodyBn,
        aiNotes: draft,
      })
    );
    router.push('/admin/posts/new');
  };

  return (
    <AdminPageShell title="AI Writer">
      <PageHeader
        title="AI Writer"
        description="Generate a newsroom-ready first draft. Tone, language, and key angles are configurable."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'AI Writer' }]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card padded>
          <CardHeader
            title="Compose"
            subtitle="Describe the story; the assistant produces the first draft."
            action={
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <Icon.Sparkles size={14} className="text-accent" />
                Beta
              </span>
            }
          />
          <div className="mt-4 space-y-4">
            <Input
              label="Topic / headline"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., new road project in Phulpur"
              hint="Required. Be specific — better topics produce better drafts."
            />
            <Input
              label="Keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="infrastructure, development, Mymensingh"
              hint="Comma-separated angles to include."
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      tone === t
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-white text-ink-muted hover:border-accent/40 hover:text-ink'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">{toneGuidance[tone].en}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Language</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'bn', label: 'Bangla' },
                  { value: 'en', label: 'English' },
                  { value: 'both', label: 'Both' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLang(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      lang === opt.value
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-white text-ink-muted hover:border-accent/40 hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} loading={loading} disabled={!topic.trim()} iconLeft={<Icon.Wand size={14} />}>
                {draft ? 'Regenerate' : 'Generate draft'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setTopic('');
                  setKeywords('');
                  setTone('Neutral');
                  setLang('bn');
                  setDraft('');
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        <Card padded={false} className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-ink">Generated draft</p>
              <p className="text-xs text-ink-muted">{wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min read</p>
            </div>
            {draft ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(draft).then(() => push({ tone: 'success', title: 'Copied to clipboard' }))} iconLeft={<Icon.Copy size={14} />}>
                  Copy
                </Button>
                <Button size="sm" onClick={useInEditor} iconLeft={<Icon.ArrowRight size={14} />}>
                  Use in editor
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex-1 p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
                <span className="mb-3 inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-4 border-accent/20 border-t-accent" />
                <p className="text-sm">Drafting your article…</p>
              </div>
            ) : draft ? (
              <pre
                className={`whitespace-pre-wrap text-sm leading-relaxed text-ink ${
                  lang !== 'en' ? 'font-bangla' : ''
                }`}
              >
                {draft}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-20 text-center text-ink-muted">
                <Icon.Sparkles size={28} className="text-accent" />
                <p className="mt-3 text-sm">Enter a topic and press Generate to produce a draft.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminPageShell>
  );
}
