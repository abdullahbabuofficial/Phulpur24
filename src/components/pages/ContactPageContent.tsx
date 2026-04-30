'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { messages } from '@/lib/supabase';
import type { Category, Lang } from '@/lib/types';

interface ContactPageContentProps {
  lang: Lang;
  categories?: Category[];
}

const copy = {
  bn: {
    title: 'যোগাযোগ করুন',
    intro: 'আমাদের সাথে যোগাযোগ করতে নিচের ফর্মটি পূরণ করুন',
    sentTitle: 'বার্তা পাঠানো হয়েছে!',
    sentMessage: 'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।',
    fields: {
      name: { label: 'নাম', placeholder: 'আপনার নাম' },
      email: { label: 'ইমেইল', placeholder: 'your@email.com' },
      subject: { label: 'বিষয়', placeholder: 'বার্তার বিষয়' },
      message: { label: 'বার্তা', placeholder: 'আপনার বার্তা লিখুন...' },
    },
    submit: 'বার্তা পাঠান',
    info: [
      { icon: '📍', label: 'ঠিকানা', value: 'ফুলপুর, ময়মনসিংহ, বাংলাদেশ' },
      { icon: '📧', label: 'ইমেইল', value: 'info@phulpur24.com' },
      { icon: '📞', label: 'ফোন', value: '+880 1700-000000' },
      { icon: '🕐', label: 'সময়', value: 'সোম-শুক্র: সকাল ৯টা - রাত ৮টা' },
    ],
  },
  en: {
    title: 'Contact Us',
    intro: 'Fill out the form below to get in touch with us',
    sentTitle: 'Message sent!',
    sentMessage: 'We will get back to you soon.',
    fields: {
      name: { label: 'Name', placeholder: 'Your name' },
      email: { label: 'Email', placeholder: 'your@email.com' },
      subject: { label: 'Subject', placeholder: 'Message subject' },
      message: { label: 'Message', placeholder: 'Write your message...' },
    },
    submit: 'Send Message',
    info: [
      { icon: '📍', label: 'Address', value: 'Phulpur, Mymensingh, Bangladesh' },
      { icon: '📧', label: 'Email', value: 'info@phulpur24.com' },
      { icon: '📞', label: 'Phone', value: '+880 1700-000000' },
      { icon: '🕐', label: 'Hours', value: 'Mon-Fri: 9:00 AM - 8:00 PM' },
    ],
  },
} satisfies Record<Lang, {
  title: string;
  intro: string;
  sentTitle: string;
  sentMessage: string;
  fields: Record<'name' | 'email' | 'subject' | 'message', { label: string; placeholder: string }>;
  submit: string;
  info: Array<{ icon: string; label: string; value: string }>;
}>;

export default function ContactPageContent({ lang, categories = [] }: ContactPageContentProps) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const content = copy[lang];
  const banglaClass = lang === 'bn' ? 'font-bangla' : '';
  const { config } = useSiteConfig();

  // Build contact info from config
  const contactInfo = [
    {
      icon: '📍',
      label: lang === 'bn' ? 'ঠিকানা' : 'Address',
      value: lang === 'bn' ? config.contact.addressBn : config.contact.addressEn,
    },
    {
      icon: '📧',
      label: lang === 'bn' ? 'ইমেইল' : 'Email',
      value: config.contact.email,
    },
    {
      icon: '📞',
      label: lang === 'bn' ? 'ফোন' : 'Phone',
      value: config.contact.phone,
    },
    {
      icon: '🕐',
      label: lang === 'bn' ? 'সময়' : 'Hours',
      value: lang === 'bn' ? config.contact.hoursBn : config.contact.hoursEn,
    },
  ];

  return (
    <div className={`min-h-screen bg-brand-soft ${banglaClass}`}>
      <Header lang={lang} />
      <Navigation lang={lang} categories={categories} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold text-brand-text mb-2 ${banglaClass}`}>{content.title}</h1>
        <p className={`text-brand-muted mb-8 ${banglaClass}`}>{content.intro}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-brand-border p-6">
              {sent ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className={`text-xl font-bold text-brand-text mb-2 ${banglaClass}`}>{content.sentTitle}</h3>
                  <p className={`text-brand-muted ${banglaClass}`}>{content.sentMessage}</p>
                </div>
              ) : (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (submitting) return;
                    setSubmitting(true);
                    setError('');
                    const form = event.currentTarget as HTMLFormElement;
                    const fd = new FormData(form);
                    const res = await messages.createMessage({
                      name: String(fd.get('name') ?? ''),
                      email: String(fd.get('email') ?? ''),
                      subject: String(fd.get('subject') ?? ''),
                      message: String(fd.get('message') ?? ''),
                      lang,
                    });
                    setSubmitting(false);
                    if (res.error) {
                      setError(res.error.message);
                      return;
                    }
                    setSent(true);
                    form.reset();
                  }}
                  className="space-y-4"
                >
                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      id="name"
                      label={content.fields.name.label}
                      placeholder={content.fields.name.placeholder}
                      className={banglaClass}
                    />
                    <Field
                      id="email"
                      type="email"
                      label={content.fields.email.label}
                      placeholder={content.fields.email.placeholder}
                      className={banglaClass}
                    />
                  </div>
                  <Field
                    id="subject"
                    label={content.fields.subject.label}
                    placeholder={content.fields.subject.placeholder}
                    className={banglaClass}
                  />
                  <div>
                    <label htmlFor="message" className={`block text-sm font-medium text-brand-text mb-1 ${banglaClass}`}>
                      {content.fields.message.label}
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                      placeholder={content.fields.message.placeholder}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 ${banglaClass}`}
                  >
                    {submitting ? '…' : content.submit}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {contactInfo.map((info) => (
              <div key={info.label} className="bg-white rounded-xl border border-brand-border p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <p className={`text-xs text-brand-muted ${banglaClass}`}>{info.label}</p>
                    <p className={`text-sm font-medium text-brand-text ${banglaClass}`}>{info.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer lang={lang} categories={categories} />
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  className,
  type = 'text',
}: {
  id: string;
  label: string;
  placeholder: string;
  className: string;
  type?: 'text' | 'email';
}) {
  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium text-brand-text mb-1 ${className}`}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        placeholder={placeholder}
      />
    </div>
  );
}
