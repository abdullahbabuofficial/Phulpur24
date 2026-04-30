'use client';

import { useEffect, useState } from 'react';
import { comments } from '@/lib/supabase';
import type { CommentRow, Lang } from '@/lib/supabase/types';

interface CommentsThreadProps {
  articleId: string;
  lang: Lang;
  enabled?: boolean;
}

export default function CommentsThread({ articleId, lang, enabled = true }: CommentsThreadProps) {
  const [list, setList] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMsg, setPendingMsg] = useState('');

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    comments.listForArticle(articleId).then((r) => {
      if (cancelled) return;
      setList(r.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [articleId, enabled]);

  if (!enabled) return null;

  const isBn = lang === 'bn';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setPendingMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await comments.createComment({
      articleId,
      authorName: String(fd.get('name') ?? ''),
      authorEmail: String(fd.get('email') ?? ''),
      body: String(fd.get('body') ?? ''),
    });
    setSubmitting(false);
    if (res.error) {
      setPendingMsg(isBn ? 'মন্তব্য পাঠানো যায়নি।' : 'Could not submit your comment.');
      return;
    }
    setPendingMsg(isBn ? 'মন্তব্যটি যাচাইয়ের জন্য জমা দেওয়া হয়েছে। অনুমোদনের পর প্রকাশ পাবে।' : 'Comment submitted for review. It will appear after moderation.');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section className={`mt-8 bg-white rounded-xl border border-brand-border p-6 ${isBn ? 'font-bangla' : ''}`}>
      <h2 className={`text-xl font-bold text-brand-text mb-4 ${isBn ? 'font-bangla' : ''}`}>
        {isBn ? 'মন্তব্য' : 'Comments'}
        <span className="ml-2 text-sm font-normal text-brand-muted">({list.length})</span>
      </h2>

      {loading ? (
        <p className="text-sm text-brand-muted">{isBn ? 'লোড হচ্ছে…' : 'Loading…'}</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-brand-muted">
          {isBn ? 'এখনও কোনো মন্তব্য নেই। প্রথম মন্তব্যকারী হোন।' : 'No comments yet. Be the first to comment.'}
        </p>
      ) : (
        <ul className="space-y-4 mb-6">
          {list.map((c) => (
            <li key={c.id} className="border-l-2 border-brand-border pl-3">
              <p className={`text-sm font-semibold text-brand-text ${isBn ? 'font-bangla' : ''}`}>{c.author_name}</p>
              <p className="text-xs text-brand-muted mb-1">{new Date(c.created_at).toLocaleString()}</p>
              <p className={`text-sm text-brand-text whitespace-pre-wrap ${isBn ? 'font-bangla' : ''}`}>{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-brand-border pt-5 mt-2">
        <p className={`text-sm font-medium text-brand-text ${isBn ? 'font-bangla' : ''}`}>
          {isBn ? 'মন্তব্য করুন' : 'Leave a comment'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="name"
            type="text"
            required
            placeholder={isBn ? 'নাম' : 'Name'}
            className={`border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary ${isBn ? 'font-bangla' : ''}`}
          />
          <input
            name="email"
            type="email"
            placeholder={isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}
            className="border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <textarea
          name="body"
          rows={4}
          required
          placeholder={isBn ? 'মন্তব্য…' : 'Your comment…'}
          className={`w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none ${isBn ? 'font-bangla' : ''}`}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={`px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 ${isBn ? 'font-bangla' : ''}`}
          >
            {submitting ? '…' : isBn ? 'পোস্ট করুন' : 'Post comment'}
          </button>
          {pendingMsg ? <p className="text-xs text-brand-muted">{pendingMsg}</p> : null}
        </div>
      </form>
    </section>
  );
}
