import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const;

function unauthorized(reason: string) {
  return NextResponse.json(
    { ok: false, error: reason },
    { status: 401, headers: NO_STORE_HEADERS }
  );
}

/**
 * Verify the caller is signed in to Supabase by checking the access token
 * passed as `Authorization: Bearer <token>`. If Supabase env is missing or
 * the token is invalid, return 401. This route would otherwise be open to
 * the entire internet and would burn through the Anthropic key.
 */
async function requireAuthedUser(request: Request): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, response: unauthorized('Auth backend not configured.') };
  }

  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, response: unauthorized('Missing bearer token.') };
  }

  const token = match[1].trim();
  if (!token) {
    return { ok: false, response: unauthorized('Empty bearer token.') };
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) {
      return { ok: false, response: unauthorized('Invalid or expired token.') };
    }
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, response: unauthorized('Could not verify token.') };
  }
}

interface Body {
  topic?: string;
  keywords?: string;
  tone?: string;
  language?: 'bn' | 'en' | 'both';
}

const SYSTEM = `You are a newsroom assistant for Phulpur24, a bilingual (Bangla / English) local news platform serving Phulpur upazila in Mymensingh, Bangladesh. You write fact-grounded, neutral, well-structured drafts. Use clear paragraphs and short headings. Do not fabricate quotes or named sources. Do not speculate.`;

function buildPrompt({ topic, keywords, tone, language }: Required<Body>) {
  const langInstruction =
    language === 'bn'
      ? 'Write the entire draft in Bangla.'
      : language === 'en'
      ? 'Write the entire draft in English.'
      : 'Produce the draft in both Bangla and English, separated by `---`.';
  return `Write a publishable first draft for a Phulpur24 news article.

Topic: ${topic}
Key angles: ${keywords || '(use your judgement)'}
Tone: ${tone}
Length: 250–400 words.

${langInstruction}

Structure each language version with a one-line headline, then 3–4 short paragraphs separated by blank lines, optionally with a "## Subheading" between sections. Be specific, but flag any unverified claim with "(to confirm)".`;
}

const cannedBn = (topic: string, kw: string, tone: string) => `ফুলপুরে ${topic} নিয়ে বিস্তারিত প্রতিবেদন

ফুলপুর উপজেলায় ${topic} সংক্রান্ত একটি গুরুত্বপূর্ণ অগ্রগতি হয়েছে। প্রতিবেদনটি ${tone.toLowerCase()} সুরে রচিত। ${kw ? `মূল বিষয়গুলোর মধ্যে রয়েছে ${kw}।` : ''}

স্থানীয় প্রশাসন জানিয়েছে, বিষয়টি নিয়ে সংশ্লিষ্ট দপ্তরগুলো সমন্বিতভাবে কাজ করছে। নাগরিক সেবা, নিরাপত্তা এবং দীর্ঘমেয়াদি উন্নয়নের দিক বিবেচনায় পরবর্তী পদক্ষেপ নেওয়া হবে।

স্থানীয় বাসিন্দারা আশা করছেন, এই উদ্যোগ দ্রুত বাস্তবায়ন হলে এলাকার মানুষ সরাসরি উপকৃত হবেন।`;

const cannedEn = (topic: string, kw: string, tone: string) => `Phulpur update on ${topic}

A significant ${tone.toLowerCase()} development concerning ${topic} has occurred in Phulpur upazila. ${kw ? `Key angles include ${kw}.` : ''}

Local administration said relevant offices are working in coordination on the matter. Next steps will consider public service, safety, and long-term development needs.

Residents hope the initiative will move quickly and bring direct benefits to the community.`;

export async function POST(request: Request) {
  const auth = await requireAuthedUser(request);
  if (!auth.ok) return auth.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    /* empty */
  }
  const topic = (body.topic ?? '').trim();
  const keywords = (body.keywords ?? '').trim();
  const tone = (body.tone ?? 'Neutral').trim();
  const language = (body.language ?? 'bn') as 'bn' | 'en' | 'both';

  if (!topic) {
    return NextResponse.json(
      { ok: false, error: 'Topic is required' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: SYSTEM,
          messages: [
            { role: 'user', content: buildPrompt({ topic, keywords, tone, language }) },
          ],
        }),
      });
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `LLM ${res.status}: ${await res.text()}` },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }
      const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = (json.content ?? [])
        .map((p) => (p.type === 'text' ? p.text ?? '' : ''))
        .join('')
        .trim();
      return NextResponse.json(
        { ok: true, mode: 'live', draft: text },
        { headers: NO_STORE_HEADERS }
      );
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }
  }

  // Fallback: deterministic canned templates so the UI works without an API key.
  const draft =
    language === 'bn'
      ? cannedBn(topic, keywords, tone)
      : language === 'en'
      ? cannedEn(topic, keywords, tone)
      : `${cannedBn(topic, keywords, tone)}\n\n---\n\n${cannedEn(topic, keywords, tone)}`;

  return NextResponse.json(
    { ok: true, mode: 'fallback', draft },
    { headers: NO_STORE_HEADERS }
  );
}
