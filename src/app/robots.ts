import type { MetadataRoute } from 'next';

const SITE_URL = 'https://kidaysweb.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 後台與 API 無需被搜尋引擎收錄
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
