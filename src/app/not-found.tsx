import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary mb-4">404</div>
        <h1 className="text-2xl font-bold text-brand-text mb-3">পৃষ্ঠাটি পাওয়া যায়নি</h1>
        <p className="text-brand-muted mb-6">
          আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি সরিয়ে নেওয়া হয়েছে বা মুছে ফেলা হয়েছে।
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/bn" className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors font-bangla">
            হোমে যান
          </Link>
          <Link href="/bn" className="px-5 py-2.5 border border-brand-border rounded-lg font-medium hover:bg-brand-soft transition-colors font-bangla">
            সর্বশেষ সংবাদ
          </Link>
        </div>
      </div>
    </div>
  );
}
