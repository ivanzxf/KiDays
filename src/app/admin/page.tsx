'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface CountItem {
  label: string;
  count: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface Metrics {
  generatedAt: string;
  users: {
    total: number;
    newLast7Days: number;
    activeLast7Days: number;
    activeLast30Days: number;
    signupTrend: TrendPoint[];
    dailyActive: TrendPoint[];
  };
  students: {
    total: number;
    byApplicationType: CountItem[];
    byGender: CountItem[];
    byBirthYear: CountItem[];
    perUser: CountItem[];
  };
  applications: {
    total: number;
    topSchools: CountItem[];
    byStatus: CountItem[];
    byLevel: CountItem[];
  };
  database: {
    schools: { total: number; active: number; byType: CountItem[] };
    cycles: { total: number; published: number; byStatus: CountItem[]; byLevel: CountItem[] };
    events: { total: number; missingDate: number; byType: CountItem[] };
    cyclesMissingKeyEvents: {
      total: number;
      samples: { school: string; academicYear: string; level: string; missing: string[] }[];
    };
    monitor: { key: string; lastCheckedAt: string; lastChangedAt: string | null }[];
  };
}

const LABELS: Record<string, Record<string, string>> = {
  applicationType: { primary: '小一', kindergarten: '幼稚園' },
  gender: { boy: '男', girl: '女' },
  level: { primary: '小一', kindergarten: '幼稚園', pn: 'PN' },
  schoolType: {
    government: '官立',
    aided: '資助',
    direct_subsidy: '直資',
    private: '私立',
    pis: '私立獨立學校',
    international: '國際',
    special: '特殊',
  },
  cycleStatus: { draft: '草稿', published: '已發布', archived: '已封存' },
  applicationStatus: {
    planned: '計劃中',
    interested: '有興趣',
    applied: '已報名',
    interviewing: '面試中',
    waitlisted: '候補',
    offered: '已取錄',
    rejected: '未取錄',
    accepted: '已接受',
    declined: '已放棄',
  },
  eventType: {
    open_day: '開放日',
    info_session: '簡介會',
    application_open: '申請開始',
    application_deadline: '申請截止',
    assessment: '評估',
    first_interview: '第一次面試',
    second_interview: '第二次面試',
    third_interview: '第三次面試',
    result_release: '結果公布',
    registration: '註冊',
    parent_meeting: '家長會',
    waiting_list: '候補',
    other: '其他',
  },
};

function translate(group: keyof typeof LABELS, value: string): string {
  return LABELS[group]?.[value] ?? value;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Hong_Kong',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatTile({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg bg-primary-soft px-4 py-3">
      <p className="text-xs font-medium text-primary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function BarList({ items, emptyText = '暫無資料' }: { items: CountItem[]; emptyText?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-slate-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-primary">{item.count}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Trend({ points, emptyText }: { points: TrendPoint[]; emptyText: string }) {
  const total = points.reduce((sum, point) => sum + point.count, 0);
  if (total === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }
  const max = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="flex items-end gap-1">
      {points.map((point) => (
        <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400">{point.count || ''}</span>
          <div
            className="w-full rounded-t bg-primary/70"
            style={{ height: `${Math.max((point.count / max) * 72, point.count > 0 ? 4 : 0)}px` }}
            title={`${point.date}：${point.count}`}
          />
          <span className="text-[10px] text-slate-400">{point.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized' | 'forbidden' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');

  const loadMetrics = useCallback(async () => {
    setStatus('loading');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setStatus('unauthorized');
      return;
    }

    try {
      const response = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        setStatus('unauthorized');
        return;
      }
      if (response.status === 403) {
        setStatus('forbidden');
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrorMessage(body?.message ?? `讀取失敗（${response.status}）`);
        setStatus('error');
        return;
      }

      setMetrics((await response.json()) as Metrics);
      setStatus('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  if (status !== 'ready' || !metrics) {
    const message =
      status === 'loading'
        ? '載入中…'
        : status === 'unauthorized'
          ? '請先登入後再開啟後台。'
          : status === 'forbidden'
            ? '此帳號沒有後台權限。請確認 ADMIN_EMAILS 已包含你的登入電郵。'
            : `讀取失敗：${errorMessage}`;

    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadMetrics()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            重新載入
          </button>
          <Link
            href="/"
            className="rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
          >
            回到看板
          </Link>
        </div>
      </main>
    );
  }

  const { users, students, applications, database } = metrics;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KiDays 後台</h1>
          <p className="mt-1 text-xs text-slate-500">
            資料更新時間：{formatDateTime(metrics.generatedAt)}（香港時間）
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadMetrics()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            重新整理
          </button>
          <Link
            href="/"
            className="rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
          >
            回到看板
          </Link>
        </div>
      </header>

      <Section title="用戶與註冊">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="註冊用戶總數" value={users.total} />
          <StatTile label="近 7 天新註冊" value={users.newLast7Days} />
          <StatTile label="近 7 天有登入" value={users.activeLast7Days} />
          <StatTile label="近 30 天有登入" value={users.activeLast30Days} />
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">近 14 天每日使用人數</p>
            <Trend points={users.dailyActive} emptyText="還沒有活動紀錄（新記錄表剛開始收集）。" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">近 14 天新註冊</p>
            <Trend points={users.signupTrend} emptyText="近 14 天沒有新註冊。" />
          </div>
        </div>
      </Section>

      <Section title="學校申請熱度" hint={applications.total === 0 ? '目前還沒有家長加入學校，數字會是空的。' : undefined}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="申請紀錄總數" value={applications.total} />
          <StatTile label="學生總數" value={students.total} />
          <StatTile
            label="每位家長學生數（平均）"
            value={
              students.total === 0
                ? '—'
                : (students.total / Math.max(users.total, 1)).toFixed(1)
            }
          />
          <StatTile
            label="家長平均加入學校數"
            value={applications.total === 0 ? '—' : (applications.total / Math.max(students.total, 1)).toFixed(1)}
          />
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700">最熱門學校（被家長加入次數）</p>
            <BarList items={applications.topSchools} emptyText="還沒有家長加入學校。" />
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">申請狀態分布</p>
              <BarList
                items={applications.byStatus.map((item) => ({
                  label: translate('applicationStatus', item.label),
                  count: item.count,
                }))}
                emptyText="尚無資料。"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">幼稚園 / 小一 比例</p>
              <BarList
                items={applications.byLevel.map((item) => ({
                  label: translate('level', item.label),
                  count: item.count,
                }))}
                emptyText="尚無資料。"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="用戶畫像" hint="依學生資料統計。目前可用的欄位只有性別、出生年月與申請類型。">
        <div className="grid gap-6 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">申請類型</p>
            <BarList
              items={students.byApplicationType.map((item) => ({
                label: translate('applicationType', item.label),
                count: item.count,
              }))}
              emptyText="尚無學生資料。"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">性別</p>
            <BarList
              items={students.byGender.map((item) => ({
                label: translate('gender', item.label),
                count: item.count,
              }))}
              emptyText="尚無學生資料。"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">出生年份</p>
            <BarList items={students.byBirthYear} emptyText="尚無學生資料。" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">每戶學生人數</p>
            <BarList items={students.perUser} emptyText="尚無學生資料。" />
          </div>
        </div>
      </Section>

      <Section title="資料庫健康度" hint="用來檢查學校資料是否完整、監控腳本是否仍有在跑。">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="學校" value={database.schools.total} sub={`啟用中 ${database.schools.active}`} />
          <StatTile
            label="招生週期"
            value={database.cycles.total}
            sub={`已發布 ${database.cycles.published}`}
          />
          <StatTile label="事件" value={database.events.total} />
          <StatTile
            label="未定日期的事件"
            value={database.events.missingDate}
            sub="需持續跟進"
          />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">學校類型</p>
            <BarList
              items={database.schools.byType.map((item) => ({
                label: translate('schoolType', item.label),
                count: item.count,
              }))}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">招生階段</p>
            <BarList
              items={database.cycles.byLevel.map((item) => ({
                label: translate('level', item.label),
                count: item.count,
              }))}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">週期狀態</p>
            <BarList
              items={database.cycles.byStatus.map((item) => ({
                label: translate('cycleStatus', item.label),
                count: item.count,
              }))}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            已發布週期但缺少關鍵事件（共 {database.cyclesMissingKeyEvents.total} 個）
          </p>
          {database.cyclesMissingKeyEvents.samples.length === 0 ? (
            <p className="text-sm text-slate-400">沒有缺漏，全部已發布週期都有申請開始與申請截止。</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-600">
              {database.cyclesMissingKeyEvents.samples.map((item) => (
                <li
                  key={`${item.school}-${item.academicYear}-${item.level}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium text-slate-700">{item.school}</span>
                  <span className="text-xs text-slate-500">
                    {item.academicYear} · {translate('level', item.level)} · 缺 {item.missing.join('、')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-slate-700">學校資料監控（p1tracker）</p>
          {database.monitor.length === 0 ? (
            <p className="text-sm text-slate-400">尚無監控紀錄。</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-600">
              {database.monitor.map((item) => (
                <li key={item.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-medium text-slate-700">{item.key}</span>
                  <span className="text-xs text-slate-500">
                    上次檢查 {formatDateTime(item.lastCheckedAt)} · 上次變動 {formatDateTime(item.lastChangedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </main>
  );
}
