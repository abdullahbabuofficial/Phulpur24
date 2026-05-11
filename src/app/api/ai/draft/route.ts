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
Length: 250-400 words.

${langInstruction}

Structure each language version with a one-line headline, then 3-4 short paragraphs separated by blank lines, optionally with a "## Subheading" between sections. Be specific, but flag any unverified claim with "(to confirm)".`;
}

function buildFallbackDraft(params: Required<Body>): string {
  const localKeyPoints = params.keywords
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  const pointsLine =
    localKeyPoints.length > 0
      ? localKeyPoints.join(', ')
      : params.language === 'bn'
        ? 'প্রেক্ষাপট, প্রভাব, স্থানীয় প্রতিক্রিয়া'
        : 'context, impact, local reaction';

  const en = `${params.topic}

## Key context
Initial reporting indicates this topic is relevant for local readers in Phulpur. This draft is prepared as a newsroom fallback and should be updated with verified quotes, timeline details, and official attribution before publication.

## What we know so far
Current working angles include: ${pointsLine}. Editors should confirm dates, locations, and stakeholder names directly from primary sources.

## Local impact and next steps
Residents and local institutions may be affected depending on scope and implementation details. Reporters should gather field reactions and include any follow-up updates from authorities.

## Verification note
This is a structured starter draft generated without live LLM output. Please fact-check all statements before publishing.`;

  const bn = `${params.topic}

## প্রাথমিক প্রেক্ষাপট
ফুলপুরের পাঠকদের জন্য বিষয়টি গুরুত্বপূর্ণ হওয়ায় এটি একটি নিউজরুম-ফলব্যাক খসড়া হিসেবে প্রস্তুত করা হয়েছে। প্রকাশের আগে অবশ্যই যাচাই করা উদ্ধৃতি, সময়রেখা এবং আনুষ্ঠানিক সূত্র যোগ করতে হবে।

## এখন পর্যন্ত জানা তথ্য
প্রাথমিক ফোকাস পয়েন্ট: ${pointsLine}। সম্পাদকীয় টিমকে মূল উৎস থেকে তারিখ, স্থান এবং সংশ্লিষ্ট পক্ষের নাম নিশ্চিত করতে হবে।

## স্থানীয় প্রভাব ও পরবর্তী কাজ
বাস্তবায়নের ধরণ ও পরিসরের উপর নির্ভর করে স্থানীয় জনগণ ও প্রতিষ্ঠানের উপর প্রভাব পড়তে পারে। মাঠ-রিপোর্ট যুক্ত করে প্রশাসনের পরবর্তী আপডেট অন্তর্ভুক্ত করা প্রয়োজন।

## যাচাই নোট
এটি লাইভ LLM আউটপুট ছাড়া প্রস্তুত করা কাঠামোবদ্ধ প্রাথমিক খসড়া। প্রকাশের আগে সব তথ্য ফ্যাক্ট-চেক করুন।`;

  if (params.language === 'en') return en;
  if (params.language === 'bn') return bn;
  return `${bn}\n\n---\n\n${en}`;
}

export async function POST(request: Request) {
  const auth = await requireAuthedUser(request);
  if (!auth.ok) return auth.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // keep defaults
  }

  const topic = (body.topic ?? '').trim();
  const keywords = (body.keywords ?? '').trim();
  const tone = (body.tone ?? 'Neutral').trim();
  const language = (body.language ?? 'bn') as 'bn' | 'en' | 'both';
  const requestShape: Required<Body> = { topic, keywords, tone, language };

  if (!topic) {
    return NextResponse.json(
      { ok: false, error: 'Topic is required' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
  if (topic.length > 240) {
    return NextResponse.json(
      { ok: false, error: 'Topic is too long. Keep it under 240 characters.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
  if (keywords.length > 500 || tone.length > 120) {
    return NextResponse.json(
      { ok: false, error: 'Keywords or tone input exceeds allowed length.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'AI draft service is unavailable: ANTHROPIC_API_KEY is not configured.',
      },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 25_000);
    let res: Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: abort.signal,
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: SYSTEM,
          messages: [
            { role: 'user', content: buildPrompt({ topic, keywords, tone, language }) },
          ],
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const upstream = (await res.text()).slice(0, 400);
      const fallbackDraft = buildFallbackDraft(requestShape);
      return NextResponse.json(
        {
          ok: true,
          mode: 'fallback',
          warning: `Live AI unavailable (LLM ${res.status}). Returned fallback draft.`,
          upstream: upstream || undefined,
          draft: fallbackDraft,
        },
        { status: 200, headers: NO_STORE_HEADERS }
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
    const fallbackDraft = buildFallbackDraft(requestShape);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: true,
        mode: 'fallback',
        warning: 'Live AI request failed; returned fallback draft.',
        upstream: message,
        draft: fallbackDraft,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }
}
