import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import DocumentLanguage from "@/components/common/DocumentLanguage";
import SiteConfigProvider from "@/components/common/SiteConfigProvider";
import { getPublicSiteConfig } from "@/lib/get-public-site-config";
import "./globals.css";

function normalizeTitleSuffix(suffix: string): string {
  const trimmed = suffix.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("|") || trimmed.startsWith("-")) return ` ${trimmed}`;
  return ` | ${trimmed}`;
}

function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  const siteName =
    config.seo.metaTitleBn?.trim() ||
    config.siteName.trim() ||
    "Phulpur24";
  const englishTitle =
    config.seo.metaTitleEn?.trim() ||
    config.siteName.trim() ||
    "Phulpur24";
  const titleSuffix = normalizeTitleSuffix(config.seo.metaTitleSuffix);
  const description =
    config.seo.metaDescription.trim() ||
    config.descriptionBn.trim() ||
    config.descriptionEn.trim() ||
    "Phulpur24";

  return {
    title: {
      default: siteName,
      template: `%s${titleSuffix || ` | ${siteName}`}`,
    },
    description,
    applicationName: siteName,
    openGraph: {
      title: englishTitle,
      description,
      siteName,
      type: "website",
      locale: "bn_BD",
    },
    icons: isHttpUrl(config.branding.faviconUrl)
      ? {
          icon: [{ url: config.branding.faviconUrl }],
          shortcut: [{ url: config.branding.faviconUrl }],
          apple: [{ url: config.branding.faviconUrl }],
        }
      : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverConfig = await getPublicSiteConfig();

  const adsenseEnabled =
    serverConfig.features.enableAds &&
    typeof serverConfig.ads.adsenseId === 'string' &&
    serverConfig.ads.adsenseId.startsWith('ca-pub-');

  return (
    <html lang="bn">
      <body className="antialiased">
        <Suspense fallback={null}>
          <DocumentLanguage />
        </Suspense>
        <SiteConfigProvider serverConfig={serverConfig}>{children}</SiteConfigProvider>
        {adsenseEnabled ? (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${serverConfig.ads.adsenseId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
