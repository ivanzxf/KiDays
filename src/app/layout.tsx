import type { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

const SITE_URL = 'https://kidaysweb.vercel.app';
const SITE_NAME = 'KiDays 童步';
const SITE_TITLE = 'KiDays 童步｜香港小學升學申請進度看板';
const SITE_DESCRIPTION =
  '專為香港小學升學家長而設的申請進度看板：把心儀學校的開放日、簡介會、申請開放、申請截止、面試安排與結果公佈日期收進同一個看板，標記申請進度，一步步從容準備。';

export const metadata: Metadata = {
  // 讓相對路徑（canonical、Open Graph）自動補上正式網域
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s｜${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    '香港小學',
    '小一入學',
    '小學升學',
    '升學申請',
    '申請截止日期',
    '開放日',
    '簡介會',
    '面試安排',
    '結果公佈',
    '申請進度看板',
    'KiDays 童步',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_HK',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+HK:wght@400;500;700;900&family=Noto+Serif+HK:wght@600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background-gray">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
