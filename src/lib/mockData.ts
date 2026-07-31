import { DashboardSchool, Event, School, formatSchoolForFrontend } from '@/types';

const timestamp = new Date().toISOString();

// Supabase 格式的 mock 数据：现阶段只保留小學
const supabaseMockSchools: School[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    name_zh: '港島直資第一小學',
    name_en: 'HK Island Dummy Direct Subsidy Primary No.1',
    type: 'primary',
    application_level: 'primary',
    district: '港島區',
    gender: 'coed',
    gender_policy: 'coed',
    school_type: 'direct_subsidy',
    school_net: '12',
    address_zh: '香港島中西區半山區一號',
    address_en: '1 Mid-Levels, Central & Western District, Hong Kong Island',
    website: 'https://example-ps1.kidays.test',
    phone: '2812 3456',
    email: 'admission@ps1.kidays.test',
    remarks: 'mock primary school',
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    name_zh: '九龍男拔資助小學',
    name_en: 'Kowloon Boys Aided Dummy Primary No.2',
    type: 'primary',
    application_level: 'primary',
    district: '九龍區',
    gender: 'boys',
    gender_policy: 'boys',
    school_type: 'aided',
    school_net: '40',
    address_zh: '九龍旺角砵蘭街二號',
    address_en: '2 Portland Street, Mong Kok, Kowloon',
    website: 'https://example-ps2.kidays.test',
    phone: '2388 9910',
    email: 'admission@ps2.kidays.test',
    remarks: 'mock primary school',
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    name_zh: '新界國際小學',
    name_en: 'New Territories Dummy International Primary No.3',
    type: 'primary',
    application_level: 'primary',
    district: '新界區',
    gender: 'coed',
    gender_policy: 'coed',
    school_type: 'international',
    school_net: '91',
    address_zh: '新界沙田科學園三號',
    address_en: '3 Science Park, Sha Tin, New Territories',
    website: 'https://example-ps3.kidays.test',
    phone: '2699 0001',
    email: 'admission@ps3.kidays.test',
    remarks: 'mock primary school',
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    name_zh: '港島官立小學',
    name_en: 'HK Island Government Dummy Primary No.4',
    type: 'primary',
    application_level: 'primary',
    district: '港島區',
    gender: 'coed',
    gender_policy: 'coed',
    school_type: 'government',
    school_net: '18',
    address_zh: '香港島灣仔皇后大道東四號',
    address_en: "4 Queen's Road East, Wan Chai, Hong Kong Island",
    website: 'https://example-ps4.kidays.test',
    phone: '2528 7788',
    email: 'admission@ps4.kidays.test',
    remarks: 'mock primary school',
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    name_zh: '九龍私立名校小學',
    name_en: 'Kowloon Private Elite Dummy Primary No.5',
    type: 'primary',
    application_level: 'primary',
    district: '九龍區',
    gender: 'girls',
    gender_policy: 'girls',
    school_type: 'private',
    school_net: '34',
    address_zh: '九龍尖沙咀海防道五號',
    address_en: '5 Haiphong Road, Tsim Sha Tsui, Kowloon',
    website: 'https://example-ps5.kidays.test',
    phone: '2366 4321',
    email: 'admission@ps5.kidays.test',
    remarks: 'mock primary school',
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  }
];

// 转换为前端兼容格式的学校列表
export const mockSchools: DashboardSchool[] = [
  formatSchoolForFrontend(supabaseMockSchools[0], [
    { id: 't1-1', school_id: supabaseMockSchools[0].id, title: '簡介會', description: '10/24', sort_order: 1, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't1-2', school_id: supabaseMockSchools[0].id, title: '遞交申請', description: '11/02', sort_order: 2, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't1-3', school_id: supabaseMockSchools[0].id, title: '第一次面試', description: '12/12', sort_order: 3, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't1-4', school_id: supabaseMockSchools[0].id, title: '第二次面試', description: '01/09', sort_order: 4, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[1], [
    { id: 't2-1', school_id: supabaseMockSchools[1].id, title: '簡介會', description: '10/10', sort_order: 1, created_at: timestamp, updated_at: timestamp, completed: true, completed_at: null },
    { id: 't2-2', school_id: supabaseMockSchools[1].id, title: '遞交申請', description: '11/01', sort_order: 2, created_at: timestamp, updated_at: timestamp, completed: true, completed_at: null },
    { id: 't2-3', school_id: supabaseMockSchools[1].id, title: '第一次面試', description: '12/10', sort_order: 3, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't2-4', school_id: supabaseMockSchools[1].id, title: '第二次面試', description: '日期待定', sort_order: 4, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[2], [
    { id: 't3-1', school_id: supabaseMockSchools[2].id, title: '簡介會', description: '09/20', sort_order: 1, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't3-2', school_id: supabaseMockSchools[2].id, title: '遞交申請', description: '10/14', sort_order: 2, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't3-3', school_id: supabaseMockSchools[2].id, title: '第一次面試', description: '11/07', sort_order: 3, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't3-4', school_id: supabaseMockSchools[2].id, title: '第三次面試', description: '12/19', sort_order: 4, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[3], [
    { id: 't4-1', school_id: supabaseMockSchools[3].id, title: '開放日', description: '10/18', sort_order: 1, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't4-2', school_id: supabaseMockSchools[3].id, title: '遞交申請', description: '11/08', sort_order: 2, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't4-3', school_id: supabaseMockSchools[3].id, title: '放榜', description: '12/20', sort_order: 3, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't4-4', school_id: supabaseMockSchools[3].id, title: '註冊', description: '01/06', sort_order: 4, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[4], [
    { id: 't5-1', school_id: supabaseMockSchools[4].id, title: '家長簡介會', description: '10/26', sort_order: 1, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't5-2', school_id: supabaseMockSchools[4].id, title: '遞交申請', description: '11/12', sort_order: 2, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't5-3', school_id: supabaseMockSchools[4].id, title: '第一次面試', description: '12/14', sort_order: 3, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null },
    { id: 't5-4', school_id: supabaseMockSchools[4].id, title: '第二次面試', description: '日期待定', sort_order: 4, created_at: timestamp, updated_at: timestamp, completed: false, completed_at: null }
  ])
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    date: '2026-10-24',
    title: '小一簡介會',
    type: 'primary',
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'e2',
    date: '2026-11-02',
    title: '小一申請開始',
    type: 'primary',
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'e3',
    date: '2026-12-12',
    title: '第一次面試',
    type: 'primary',
    created_at: timestamp,
    updated_at: timestamp
  }
];
