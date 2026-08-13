// Supabase 匯入結果驗證腳本（本機可跑，需 .env.local）
// 使用方式：node scripts/verify_supabase_import.mjs

import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import path from 'node:path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (typeof process.env[k] !== 'string') process.env[k] = v;
  }
} catch {
  /* noop */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey) {
  console.error('缺少 Supabase 環境變數，請確認 .env.local。');
  process.exit(1);
}

const sb = createClient(url, serviceKey);

async function main() {
  // 1. 總量
  const [sCount, cCount, eCount] = await Promise.all([
    sb.from('schools').select('count', { count: 'exact', head: true }),
    sb.from('school_cycles').select('count', { count: 'exact', head: true }),
    sb.from('school_events').select('count', { count: 'exact', head: true }),
  ]);
  console.log(
    `總筆數 → schools=${sCount.count} / cycles=${cCount.count} / events=${eCount.count}`,
  );

  // 2. 查 2 間剛匯入的學校
  const r1 = await sb
    .from('schools')
    .select(
      'id, name_zh, name_en, district, gender, gender_policy, school_type, school_net, address_zh, website, phone, email, application_level, is_active',
    )
    .in('name_zh', ['聖保羅男女中學附屬小學', '拔萃男書院附屬小學']);
  console.log('\n--- 查詢 2 間目標學校 ---');
  console.log('error:', r1.error?.message ?? null);
  (r1.data ?? []).forEach((r) => console.log(JSON.stringify(r, null, 2)));

  // 3. 2027-2028 的 cycles + 對應學校名
  const r2 = await sb
    .from('school_cycles')
    .select('id, academic_year, application_level, status, notes, school:school_id(name_zh)')
    .eq('academic_year', '2027-2028');
  console.log('\n--- 2027-2028 招生週期（含關聯學校名） ---');
  console.log('error:', r2.error?.message ?? null);
  (r2.data ?? []).forEach((r) => console.log(JSON.stringify(r, null, 2)));

  // 4. 最新 12 筆 events（含 date_status、關聯的週期與學校名）
  const r3 = await sb
    .from('school_events')
    .select(
      'id, event_type, sequence_no, title_zh, start_at, end_at, all_day, date_status, notes, cycle:school_cycle_id(academic_year, school:school_id(name_zh))',
    )
    .order('created_at', { ascending: false })
    .limit(12);
  console.log('\n--- 最新 12 筆 school_events（含 date_status） ---');
  console.log('error:', r3.error?.message ?? null);
  (r3.data ?? []).forEach((r) => console.log(JSON.stringify(r, null, 2)));

  // 5. TBD 統計
  const tbd = await sb
    .from('school_events')
    .select('count', { count: 'exact', head: true })
    .eq('date_status', 'tbd');
  const nullStart = await sb
    .from('school_events')
    .select('count', { count: 'exact', head: true })
    .is('start_at', null);
  console.log('\n--- TBD 統計 ---');
  console.log('date_status=tbd 總筆數:', tbd.count);
  console.log('start_at IS NULL 總筆數:', nullStart.count);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 驗證失敗:', err);
    process.exit(1);
  });
