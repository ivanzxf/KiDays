import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildSchoolSummaries,
  diffSchoolSummaries,
  fetchP1TrackerData,
  summariesHash,
} from '@/lib/monitor/p1tracker';
import type { SchoolSummary } from '@/lib/monitor/p1tracker';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MONITOR_KEY = 'p1tracker';

/** Vercel Cron / GitHub Actions 觸發時帶 Authorization: Bearer $CRON_SECRET。 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** 用 Resend 寄送更新通知，內容附逐校變化明細。 */
async function sendUpdateEmail(changes: string[]): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MONITOR_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    console.warn('[monitor] 未設定 RESEND_API_KEY 或 MONITOR_NOTIFY_EMAIL，跳過通知');
    return false;
  }
  const changesText = changes.join('\n\n');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KiDays 童步 <onboarding@resend.dev>',
      to: [to],
      subject: `📢 p1tracker.com 有更新（${changes.length} 間學校有變動）`,
      text: `偵測到 p1tracker.com 的學校資料有變動：\n\n${changesText}\n\n請前往上述學校的官方來源核實，確認後再同步到 KiDays 數據庫。\n\n— KiDays 自動通知`,
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

  // 1. 抓取目前資料（含逐校摘要）
  let summaries: SchoolSummary[];
  let updatedLabel: string;
  try {
    const fetched = await fetchP1TrackerData();
    summaries = buildSchoolSummaries(fetched.data);
    updatedLabel = fetched.updatedLabel;
  } catch (error) {
    console.error('[monitor] 抓取失敗:', error);
    return NextResponse.json(
      { error: 'fetch failed', message: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
  const currentHash = summariesHash(summaries);

  // 2. 讀上次快照
  const { data: snapshot, error: readError } = await supabase
    .from('site_monitor_snapshots')
    .select('id, content_hash, snapshot_data')
    .eq('monitor_key', MONITOR_KEY)
    .maybeSingle();

  if (readError) {
    console.error('[monitor] 讀快照失敗:', readError.message);
    return NextResponse.json({ error: 'db read failed' }, { status: 500 });
  }

  const now = new Date().toISOString();

  // 3. 首次執行：建立基準快照，不發信
  if (!snapshot) {
    const { error: insertError } = await supabase
      .from('site_monitor_snapshots')
      .insert({
        monitor_key: MONITOR_KEY,
        content_hash: currentHash,
        snapshot_data: summaries,
        last_checked_at: now,
      });
    if (insertError) {
      console.error('[monitor] 建立快照失敗:', insertError.message);
      return NextResponse.json({ error: 'db insert failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, changed: false, note: 'established baseline' });
  }

  // 4. 無變化：只更新檢查時間
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

  // 5. 舊格式快照（沒有逐校摘要）→ 只升級為新基準，不發信，避免首次誤報
  if (!Array.isArray(snapshot.snapshot_data)) {
    const { error: migrateError } = await supabase
      .from('site_monitor_snapshots')
      .update({
        content_hash: currentHash,
        snapshot_data: summaries,
        last_checked_at: now,
        updated_at: now,
      })
      .eq('id', snapshot.id);
    if (migrateError) {
      console.error('[monitor] 快照遷移失敗:', migrateError.message);
      return NextResponse.json({ error: 'db update failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, changed: false, note: 'migrated baseline' });
  }

  // 6. 有變化：逐校比對，產生變化明細
  const prevSummaries = snapshot.snapshot_data as SchoolSummary[];
  const changes = diffSchoolSummaries(prevSummaries, summaries);

  const { error: updateError } = await supabase
    .from('site_monitor_snapshots')
    .update({
      content_hash: currentHash,
      snapshot_data: summaries,
      last_checked_at: now,
      last_changed_at: now,
      updated_at: now,
    })
    .eq('id', snapshot.id);
  if (updateError) {
    console.error('[monitor] 更新快照失敗:', updateError.message);
    return NextResponse.json({ error: 'db update failed' }, { status: 500 });
  }

  const emailed = changes.length > 0 ? await sendUpdateEmail(changes) : false;

  return NextResponse.json({
    ok: true,
    changed: true,
    changeCount: changes.length,
    updatedLabel,
    emailed,
  });
}
