import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { getAuthors, getCategories } from '@/lib/data';
import type { Lang } from '@/lib/types';

interface AboutPageContentProps {
  lang: Lang;
}

const copy = {
  bn: {
    title: 'আমাদের সম্পর্কে',
    tagline: 'সবার আগে ফুলপুরের খবর',
    missionTitle: 'আমাদের লক্ষ্য',
    mission: [
      'ফুলপুর২৪ ময়মনসিংহ জেলার ফুলপুর উপজেলার একটি অনলাইন সংবাদ মাধ্যম। আমরা স্থানীয় সংবাদ, জাতীয় আপডেট এবং আন্তর্জাতিক খবর দ্রুততার সাথে পাঠকদের কাছে পৌঁছে দেওয়ার লক্ষ্যে কাজ করি।',
      'আমাদের দক্ষ সাংবাদিক দল সার্বক্ষণিক কাজ করে যাচ্ছে যাতে আপনি সবার আগে ফুলপুরের খবর পান। নির্ভরযোগ্য, নিরপেক্ষ এবং তথ্যনির্ভর সাংবাদিকতা আমাদের মূলনীতি।',
    ],
    teamTitle: 'আমাদের দল',
    values: [
      { icon: '⚡', title: 'দ্রুততা', desc: 'সর্বশেষ খবর সবার আগে' },
      { icon: '🎯', title: 'নির্ভরযোগ্যতা', desc: 'তথ্যনির্ভর সাংবাদিকতা' },
      { icon: '🌐', title: 'দ্বিভাষিক', desc: 'বাংলা ও ইংরেজিতে সংবাদ' },
    ],
  },
  en: {
    title: 'About Us',
    tagline: 'Phulpur news first',
    missionTitle: 'Our Mission',
    mission: [
      'Phulpur24 is an online news platform for Phulpur upazila in Mymensingh. We work to bring local news, national updates, and international stories to readers quickly.',
      'Our reporting team works around the clock so you can stay ahead of the news from Phulpur. Reliable, impartial, and fact-based journalism is our core principle.',
    ],
    teamTitle: 'Our Team',
    values: [
      { icon: '⚡', title: 'Speed', desc: 'Latest updates first' },
      { icon: '🎯', title: 'Reliability', desc: 'Fact-based journalism' },
      { icon: '🌐', title: 'Bilingual', desc: 'News in Bangla and English' },
    ],
  },
} satisfies Record<Lang, {
  title: string;
  tagline: string;
  missionTitle: string;
  mission: string[];
  teamTitle: string;
  values: Array<{ icon: string; title: string; desc: string }>;
}>;

const authorDetailsBn: Record<string, { role: string; bio: string }> = {
  a1: { role: 'সিনিয়র প্রতিবেদক', bio: 'স্থানীয় ও জাতীয় সংবাদ কভার করেন।' },
  a2: { role: 'সম্পাদক', bio: 'দশ বছরের অভিজ্ঞতাসম্পন্ন প্রধান সম্পাদক।' },
  a3: { role: 'স্থানীয় প্রতিনিধি', bio: 'ফুলপুরভিত্তিক স্থানীয় প্রতিনিধি।' },
  a4: { role: 'এসইও সম্পাদক', bio: 'ডিজিটাল সাংবাদিকতা ও এসইও বিশেষজ্ঞ।' },
  a5: { role: 'ক্রীড়া প্রতিবেদক', bio: 'আঞ্চলিক টুর্নামেন্ট কভার করেন।' },
  a6: { role: 'অনুবাদক', bio: 'দ্বিভাষিক অনুবাদ ও কনটেন্ট বিশেষজ্ঞ।' },
};

export default async function AboutPageContent({ lang }: AboutPageContentProps) {
  const [authors, categories] = await Promise.all([getAuthors(), getCategories()]);
  const content = copy[lang];
  const isBn = lang === 'bn';
  const banglaClass = isBn ? 'font-bangla' : '';

  return (
    <div className={`min-h-screen bg-brand-soft ${banglaClass}`}>
      <Header lang={lang} />
      <Navigation lang={lang} categories={categories} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block bg-primary text-white font-black text-3xl px-5 py-3 rounded-xl mb-4">
            PHULPUR<span className="text-yellow-400">24</span>
          </div>
          <h1 className={`text-3xl font-bold text-brand-text mb-3 ${banglaClass}`}>{content.title}</h1>
          <p className={`text-xl text-brand-muted ${banglaClass}`}>{content.tagline}</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-8 mb-8">
          <h2 className={`text-xl font-bold text-brand-text mb-4 ${banglaClass}`}>{content.missionTitle}</h2>
          {content.mission.map((paragraph, index) => (
            <p
              key={paragraph}
              className={`text-brand-text leading-relaxed ${index === 0 ? 'mb-4' : ''} ${banglaClass}`}
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mb-8">
          <h2 className={`text-xl font-bold text-brand-text mb-6 ${banglaClass}`}>{content.teamTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {authors.map((author) => {
              const name = isBn ? author.nameBn : author.nameEn;
              const role = isBn ? (authorDetailsBn[author.id]?.role ?? author.role) : author.role;
              const bio = isBn ? (authorDetailsBn[author.id]?.bio ?? author.bio) : author.bio;

              return (
                <div
                  key={author.id}
                  className="bg-white rounded-xl border border-brand-border p-5 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {name.charAt(0)}
                  </div>
                  <h3 className={`font-semibold text-brand-text ${banglaClass}`}>{name}</h3>
                  <p className={`text-sm text-primary mt-0.5 ${banglaClass}`}>{role}</p>
                  <p className={`text-xs text-brand-muted mt-2 ${banglaClass}`}>{bio}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.values.map((value) => (
            <div key={value.title} className="bg-white rounded-xl border border-brand-border p-6 text-center">
              <div className="text-3xl mb-3">{value.icon}</div>
              <h3 className={`font-bold text-brand-text mb-2 ${banglaClass}`}>{value.title}</h3>
              <p className={`text-sm text-brand-muted ${banglaClass}`}>{value.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer lang={lang} categories={categories} />
    </div>
  );
}
