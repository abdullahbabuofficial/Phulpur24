'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isLang } from '@/lib/i18n';

export default function DocumentLanguage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryLang = searchParams.get('lang');
    const lang = pathname.startsWith('/en') ? 'en' : !pathname.startsWith('/bn') && isLang(queryLang) ? queryLang : 'bn';

    document.documentElement.lang = lang;
  }, [pathname, searchParams]);

  return null;
}
