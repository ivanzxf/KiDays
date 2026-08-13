import type { SchoolEventType, SchoolGenderPolicy, SchoolType } from '@/types';

const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  government: '官立',
  aided: '資助',
  direct_subsidy: '直資',
  private: '私立',
  pis: '私立獨立',
  international: '國際',
  special: '特殊',
};

const SCHOOL_GENDER_LABELS: Record<SchoolGenderPolicy, string> = {
  coed: '男女校',
  boys: '男校',
  girls: '女校',
};

const SCHOOL_EVENT_TYPE_LABELS: Record<SchoolEventType, string> = {
  open_day: '開放日',
  info_session: '簡介會',
  application_open: '申請開始',
  application_deadline: '申請截止',
  assessment: '入學評估',
  first_interview: '第一面',
  second_interview: '第二面',
  third_interview: '第三面',
  result_release: '放榜',
  registration: '註冊',
  parent_meeting: '家長會',
  waiting_list: '候補通知',
  other: '其他',
};

export function formatSchoolTypeLabel(type?: SchoolType | null): string | null {
  if (!type) return null;
  return SCHOOL_TYPE_LABELS[type] ?? type;
}

export function formatSchoolGenderLabel(
  policy?: SchoolGenderPolicy | null,
): string | null {
  if (!policy) return null;
  return SCHOOL_GENDER_LABELS[policy] ?? policy;
}

export function formatSchoolEventTypeLabel(
  eventType: string,
  sequenceNo?: number | null,
): string {
  if (eventType === 'first_interview') {
    return `第一面${sequenceNo != null && sequenceNo !== 1 ? `（${sequenceNo}）` : ''}`;
  }

  return SCHOOL_EVENT_TYPE_LABELS[eventType as SchoolEventType] ?? '待辦事項';
}

export function resolveSchoolEventTitleZh(event: {
  title_zh?: string | null;
  event_type: string;
  sequence_no?: number | null;
}): string {
  return (
    event.title_zh ??
    formatSchoolEventTypeLabel(event.event_type, event.sequence_no)
  );
}
