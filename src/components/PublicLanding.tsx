import { CalendarClock, Filter, Heart, ListChecks, School as SchoolIcon, ShieldCheck } from 'lucide-react';

/**
 * 未登入時顯示的公開行銷／內容區塊。
 * 內容為純靜態文字，會隨首屏 HTML 一併輸出，讓搜尋引擎與未啟用 JavaScript 的訪客
 * 都能讀到實際內容（而非只有「正在恢復登入狀態」）。可在首頁下方捲動看到。
 */

const FEATURES = [
  {
    icon: SchoolIcon,
    title: '個人專屬看板',
    description:
      '自由加入正在考慮的學校，並以愛心標記特別心儀的學校；心儀學校自動置頂，其餘依最近期活動自動排序。',
  },
  {
    icon: ListChecks,
    title: '申請進度標記',
    description:
      '每間學校可標記「未開始、申請中、等待結果、已出結果」四種狀態，一眼看清每間學校的進度。',
  },
  {
    icon: CalendarClock,
    title: '重要日期自動整理',
    description:
      '開放日、簡介會、申請開放、申請截止與結果公佈集中顯示，並以倒數提示最接近的事件。',
  },
  {
    icon: Filter,
    title: '面試安排與性別篩選',
    description:
      '可自行新增及修改面試日期與時間；也可依子女性別篩選合適的學校，節省搜尋時間。',
  },
];

const STEPS = [
  {
    title: '用電郵註冊',
    description: '只需一個有效電郵地址即可註冊，無需填寫其他個人資料。',
  },
  {
    title: '加入心儀學校',
    description: '從學校清單加入你正在考慮的學校，建立自己的升學清單。',
  },
  {
    title: '緊貼重要日期',
    description: '標記申請進度，並透過「近期重點事件」掌握即將到來的截止與面試日期。',
  },
];

const FAQS = [
  {
    question: 'KiDays 童步的資料從哪裡來？',
    answer:
      '平台內所有學校資訊、申請日期、面試安排及結果公佈時間，均來自各校官方對外發布的公開資料。KiDays 童步只負責整理與彙整，方便家長查閱對照；學校的最新安排與正式資訊，一律以學校官方公告為準。',
  },
  {
    question: '支援哪些學校？',
    answer:
      '目前收錄香港小學的公開招生資訊，涵蓋不同校網與性別收生政策。你可以依子女性別篩選合適的學校，快速配對。',
  },
  {
    question: '我的個人資料會被如何使用？',
    answer:
      '你在平台輸入的個人資料、學校收藏與申請進度，僅供你個人的專屬看板使用，不會用作其他用途，也不會販售、租借或轉讓給第三方。',
  },
];

export default function PublicLanding() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 lg:p-7">
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
          香港小學升學資訊，收進同一個看板
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          各間小學的申請開放時間、簡介會、開放日、面試安排與結果公佈日期，往往散落在不同學校網站與通告之中。
          KiDays 童步把這些公開資訊整理成一份個人化看板：只要加入正在考慮的學校，就能在同一頁看到每間學校的申請進度，
          以及即將到來的重要日期，不怕錯過關鍵時機。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">KiDays 童步幫你整理什麼？</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-base font-black text-slate-900">{feature.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">三步開始使用</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-3 text-base font-black text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">常見問題</h2>
        <dl className="mt-4 space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <dt className="text-base font-black text-slate-900">{faq.question}</dt>
              <dd className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Heart className="h-4 w-4 text-red-400" />
          KiDays 童步 ｜ 香港小學升學申請進度看板
        </div>
        <p className="flex items-center gap-1.5 text-xs leading-6 text-slate-500">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 text-slate-400" />
          本平台僅作資訊彙整，所有學校安排請以官方公告為準。
        </p>
      </footer>
    </div>
  );
}
