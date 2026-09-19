import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const HK_TIME_ZONE = 'Asia/Hong_Kong';
const TREND_DAYS = 14;

/** 以香港時區取得 YYYY-MM-DD 日期鍵。 */
function hkDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: HK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** 由舊到新取得最近 N 天的日期鍵。 */
function recentDayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(hkDateKey(new Date(now - i * 24 * 60 * 60 * 1000)));
  }
  return keys;
}

function countBy<T>(rows: T[], pick: (row: T) => string | null | undefined) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = pick(row) ?? '未填';
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'missing supabase env' }, { status: 500 });
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return NextResponse.json(
      { error: 'missing_admin_config', message: '尚未設定 ADMIN_EMAILS 環境變數' },
      { status: 500 },
    );
  }

  // 1. 驗證呼叫者身分：以使用者 token 向 Supabase 查詢本人資料
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const email = userData?.user?.email?.toLowerCase();

  if (userError || !email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!adminEmails.includes(email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 2. 以 service role 讀取全部資料（略過 RLS，僅在伺服器端執行）
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const since = new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersResult,
    studentResult,
    applicationResult,
    cycleResult,
    schoolResult,
    eventResult,
    activityResult,
    monitorResult,
  ] = await Promise.all([
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    service.from('students').select('id, user_id, application_type, gender, birth_date, created_at'),
    service.from('student_applications').select('id, student_id, school_cycle_id, status'),
    service
      .from('school_cycles')
      .select('id, school_id, academic_year, application_level, status, is_rolling_admission'),
    service.from('schools').select('id, name_zh, type, is_active, school_type'),
    service.from('school_events').select('school_cycle_id, event_type, date_status, start_at'),
    service.from('user_activity').select('user_id, created_at').gte('created_at', since),
    service.from('site_monitor_snapshots').select('monitor_key, last_checked_at, last_changed_at'),
  ]);

  const failed = [
    usersResult.error,
    studentResult.error,
    applicationResult.error,
    cycleResult.error,
    schoolResult.error,
    eventResult.error,
    activityResult.error,
    monitorResult.error,
  ].find(Boolean);

  if (failed) {
    console.error('[admin] 讀取統計資料失敗:', failed.message);
    return NextResponse.json({ error: 'db read failed', message: failed.message }, { status: 500 });
  }

  const users = usersResult.data?.users ?? [];
  const students = studentResult.data ?? [];
  const applications = applicationResult.data ?? [];
  const cycles = cycleResult.data ?? [];
  const schools = schoolResult.data ?? [];
  const events = eventResult.data ?? [];
  const activity = activityResult.data ?? [];
  const monitorSnapshots = monitorResult.data ?? [];

  const dayKeys = recentDayKeys(TREND_DAYS);
  const now = Date.now();
  const within = (value: string | null | undefined, days: number) =>
    Boolean(value) && now - new Date(value as string).getTime() <= days * 24 * 60 * 60 * 1000;

  // ---- 用戶與註冊 ----
  const signupTrend = dayKeys.map((date) => ({
    date,
    count: users.filter((user) => user.created_at && hkDateKey(new Date(user.created_at)) === date).length,
  }));

  const dailyActive = dayKeys.map((date) => ({
    date,
    count: new Set(
      activity
        .filter((row) => hkDateKey(new Date(row.created_at)) === date)
        .map((row) => row.user_id),
    ).size,
  }));

  // ---- 用戶畫像 ----
  const studentsPerUser = new Map<string, number>();
  students.forEach((student) => {
    studentsPerUser.set(student.user_id, (studentsPerUser.get(student.user_id) ?? 0) + 1);
  });
  const perUserBuckets = new Map<string, number>();
  studentsPerUser.forEach((count) => {
    const label = count >= 3 ? '3 位或以上' : `${count} 位`;
    perUserBuckets.set(label, (perUserBuckets.get(label) ?? 0) + 1);
  });

  const birthYearCounts = countBy(students, (student) =>
    student.birth_date ? `${student.birth_date.slice(0, 4)} 年` : '未填',
  );

  // ---- 學校申請熱度 ----
  const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const schoolNameById = new Map(schools.map((school) => [school.id, school.name_zh]));

  const applicationsPerSchool = new Map<string, number>();
  applications.forEach((application) => {
    const cycle = cycleById.get(application.school_cycle_id);
    const schoolName = cycle ? schoolNameById.get(cycle.school_id) : undefined;
    if (!schoolName) return;
    applicationsPerSchool.set(schoolName, (applicationsPerSchool.get(schoolName) ?? 0) + 1);
  });

  const topSchools = Array.from(applicationsPerSchool.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const applicationsByLevel = countBy(applications, (application) => {
    const cycle = cycleById.get(application.school_cycle_id);
    return cycle?.application_level;
  });

  // ---- 資料庫健康度 ----
  const publishedCycles = cycles.filter((cycle) => cycle.status === 'published');
  const eventsByCycle = new Map<string, Set<string>>();
  events.forEach((event) => {
    const set = eventsByCycle.get(event.school_cycle_id) ?? new Set<string>();
    set.add(event.event_type);
    eventsByCycle.set(event.school_cycle_id, set);
  });

  const cyclesMissingKeyEvents = publishedCycles
    .map((cycle) => {
      const types = eventsByCycle.get(cycle.id) ?? new Set<string>();
      const missing: string[] = [];
      if (!types.has('application_open')) missing.push('申請開始');
      if (!types.has('application_deadline') && !cycle.is_rolling_admission) missing.push('申請截止');
      return {
        school: schoolNameById.get(cycle.school_id) ?? '（未知學校）',
        academicYear: cycle.academic_year,
        level: cycle.application_level ?? '未填',
        missing,
      };
    })
    .filter((item) => item.missing.length > 0);

  const missingDateEvents = events.filter(
    (event) => event.date_status === 'tbd' || (!event.start_at && event.date_status !== 'na'),
  ).length;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    users: {
      total: users.length,
      newLast7Days: users.filter((user) => within(user.created_at, 7)).length,
      activeLast7Days: users.filter((user) => within(user.last_sign_in_at, 7)).length,
      activeLast30Days: users.filter((user) => within(user.last_sign_in_at, 30)).length,
      signupTrend,
      dailyActive,
    },
    students: {
      total: students.length,
      byApplicationType: countBy(students, (student) => student.application_type),
      byGender: countBy(students, (student) => student.gender),
      byBirthYear: birthYearCounts,
      perUser: Array.from(perUserBuckets.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
    applications: {
      total: applications.length,
      topSchools,
      byStatus: countBy(applications, (application) => application.status),
      byLevel: applicationsByLevel,
    },
    database: {
      schools: {
        total: schools.length,
        active: schools.filter((school) => school.is_active).length,
        byType: countBy(schools, (school) => school.school_type),
      },
      cycles: {
        total: cycles.length,
        published: publishedCycles.length,
        byStatus: countBy(cycles, (cycle) => cycle.status),
        byLevel: countBy(cycles, (cycle) => cycle.application_level),
      },
      events: {
        total: events.length,
        missingDate: missingDateEvents,
        byType: countBy(events, (event) => event.event_type),
      },
      cyclesMissingKeyEvents: {
        total: cyclesMissingKeyEvents.length,
        samples: cyclesMissingKeyEvents.slice(0, 15),
      },
      monitor: monitorSnapshots.map((snapshot) => ({
        key: snapshot.monitor_key,
        lastCheckedAt: snapshot.last_checked_at,
        lastChangedAt: snapshot.last_changed_at,
      })),
    },
  });
}
