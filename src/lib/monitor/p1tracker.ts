import { createHash } from 'node:crypto';

const P1TRACKER_URL = 'https://www.p1tracker.com/';

/** 把字串轉成 sha256 指紋，供前後比較。 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * 把抓到的 HTML 轉成乾淨純文字，作為內容指紋的來源。
 * 移除 script/style 等動態區塊，避免廣告或隨機元素造成誤報。
 */
export function extractPageFingerprint(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
  return withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 抓取 p1tracker.com 首頁並回傳內容指紋。 */
export async function fetchP1TrackerFingerprint(): Promise<string> {
  const response = await fetch(P1TRACKER_URL, {
    headers: {
      'User-Agent': 'KiDays-monitor/1.0 (daily update checker)',
      'Accept': 'text/html',
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`p1tracker fetch failed: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  return hashContent(extractPageFingerprint(html));
}
