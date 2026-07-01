import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'KiDays 童步',
  description: '香港幼稚園和小學申請一站式信息及看板工具',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body className="min-h-screen bg-background-gray">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
