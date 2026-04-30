import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import DocumentLanguage from "@/components/common/DocumentLanguage";
import SiteConfigProvider from "@/components/common/SiteConfigProvider";
import { getPublicSiteConfig } from "@/lib/get-public-site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phulpur24 | ফুলপুর২৪",
  description: "সবার আগে ফুলপুরের খবর | Phulpur News First",
};

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
