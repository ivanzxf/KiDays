'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import './globals.css';
import { useEffect } from 'react';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { currentStudent } = useApp();
  
  useEffect(() => {
    if (currentStudent?.gender) {
      document.documentElement.setAttribute('data-theme', currentStudent.gender);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [currentStudent]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <body className="min-h-screen bg-background-gray">
        <AppProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
