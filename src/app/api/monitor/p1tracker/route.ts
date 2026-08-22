import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchP1TrackerFingerprint } from '@/lib/monitor/p1tracker';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MONITOR_KEY = 'p1tracker';

/** Vercel Cron 觸發時帶 Authorization: Bearer $CRON_SECRET；沒設定的話允許任何人觸發（方便測試）。 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** 用 Resend 寄送更新通知。 */
async function sendUpdateEmail(): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MONITOR_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    console.warn('[monitor] 未設定 RESEND_API_KEY 或 MONITOR_NOTIFY_EMAIL，跳過通知');
    return false;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KiDays 童步 <onboarding@resend.dev>',
      to: [to],
      subject: '📢 p1tracker.com 有更新，請核實',
      text: `偵測到 p1tracker.com 的內容有更新。\n\n請前往 https://www.p1tracker.com/ 核實最新學校資料，確認後再同步到 KiDays 數據庫。\n\n— KiDays 自動監控通知`,
    }),
  });
  if (!response.ok) {
    console.error('[monitor] Resend 發信失敗:', response.status, await response.text());
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'missing supabase env' }, { status: 500 });
  }
  const supabase = createClient(url, serviceKey);

  // 1. 抓取目前指紋
  let currentHash: string;
  try {
    currentHash = await fetchP1TrackerFingerprint();
  } catch (error) {
    console.error('[monitor] 抓取失敗:', error);
    return NextResponse.json(
      { error: 'fetch failed', message: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }

  // 2. 讀上次快照
  const { data: snapshot, error: readError } = await supabase
    .from('site_monitor_snapshots')
    .select('id, content_hash')
    .eq('monitor_key', MONITOR_KEY)
    .maybeSingle();

  if (readError) {
    console.error('[monitor] 讀快照失敗:', readError.message);
    return NextResponse.json({ error: 'db read failed' }, { status: 500 });
  }

  const now = new Date().toISOString();

  // 3. 首次執行：建立基準快照，不發信（避免首次全量通知）
  if (!snapshot) {
    const { error: insertError } = await supabase
      .from('site_monitor_snapshots')
      .insert({
        monitor_key: MONITOR_KEY,
        content_hash: currentHash,
        last_checked_at: now,
      });
    if (insertError) {
      console.error('[monitor] 建立快照失敗:', insertError.message);
      return NextResponse.json({ error: 'db insert failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, changed: false, note: 'established baseline' });
  }

  // 4. 無變化：更新檢查時間
  if (snapshot.content_hash === currentHash) {
    const { error: touchError } = await supabase
      .from('site_monitor_snapshots')
      .update({ last_checked_at: now, updated_at: now })
      .eq('id', snapshot.id);
    if (touchError) {
      console.error('[monitor] 更新檢查時間失敗:', touchError.message);
      return NextResponse.json({ error: 'db update failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, changed: false });
  }

  // 5. 有變化：更新快照並發信通知
  const { error: updateError } = await supabase
    .from('site_monitor_snapshots')
    .update({
      content_hash: currentHash,
      last_checked_at: now,
      last_changed_at: now,
      updated_at: now,
    })
    .eq('id', snapshot.id);
  if (updateError) {
    console.error('[monitor] 更新快照失敗:', updateError.message);
    return NextResponse.json({ error: 'db update failed' }, { status: 500 });
  }

  const emailed = await sendUpdateEmail();

  return NextResponse.json({ ok: true, changed: true, emailed });
}
