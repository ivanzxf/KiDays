import { School, Event, formatSchoolForFrontend } from '@/types';

// Supabase 格式的 mock 数据
const supabaseMockSchools: School[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name_zh: '香港幼稚園',
    name_en: 'Hong Kong Kindergarten',
    type: 'kindergarten',
    district: '港島區',
    gender: 'coed',
    school_net: '11',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name_zh: '九龍小學',
    name_en: 'Kowloon Primary School',
    type: 'primary',
    district: '九龍區',
    gender: 'boys',
    school_net: '41',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name_zh: '新界幼稚園',
    name_en: 'New Territories Kindergarten',
    type: 'kindergarten',
    district: '新界區',
    gender: 'girls',
    school_net: '91',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name_zh: '維多利亞幼稚園',
    name_en: 'Victoria Kindergarten',
    type: 'kindergarten',
    district: '港島區',
    gender: 'coed',
    school_net: '12',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name_zh: '聖保羅小學',
    name_en: "St. Paul's Primary School",
    type: 'primary',
    district: '港島區',
    gender: 'boys',
    school_net: '11',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name_zh: '海景幼稚園',
    name_en: 'Harbour View Kindergarten',
    type: 'kindergarten',
    district: '九龍區',
    gender: 'coed',
    school_net: '34',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// 转换为前端兼容格式的学校列表
export const mockSchools: (School & { nameZh: string; nameEn: string | null; schoolNet: string | null; tasks: any[] })[] = [
  formatSchoolForFrontend(supabaseMockSchools[0], [
    { id: 't1-1', school_id: supabaseMockSchools[0].id, title: '簡介會', description: '', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't1-2', school_id: supabaseMockSchools[0].id, title: '遞交申請', description: '', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't1-3', school_id: supabaseMockSchools[0].id, title: '第一次面試', description: '', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't1-4', school_id: supabaseMockSchools[0].id, title: '第二次面試', description: '', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[1], [
    { id: 't2-1', school_id: supabaseMockSchools[1].id, title: '簡介會', description: '', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: true, completed_at: null },
    { id: 't2-2', school_id: supabaseMockSchools[1].id, title: '遞交申請', description: '', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: true, completed_at: null },
    { id: 't2-3', school_id: supabaseMockSchools[1].id, title: '第一次面試', description: '', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't2-4', school_id: supabaseMockSchools[1].id, title: '第二次面試', description: '', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[2], [
    { id: 't3-1', school_id: supabaseMockSchools[2].id, title: '簡介會', description: '', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't3-2', school_id: supabaseMockSchools[2].id, title: '遞交申請', description: '', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't3-3', school_id: supabaseMockSchools[2].id, title: '第一次面試', description: '', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't3-4', school_id: supabaseMockSchools[2].id, title: '第二次面試', description: '', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[3], [
    { id: 't4-1', school_id: supabaseMockSchools[3].id, title: '簡介會', description: '', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't4-2', school_id: supabaseMockSchools[3].id, title: '遞交申請', description: '', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't4-3', school_id: supabaseMockSchools[3].id, title: '第一次面試', description: '', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't4-4', school_id: supabaseMockSchools[3].id, title: '第二次面試', description: '', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[4], [
    { id: 't5-1', school_id: supabaseMockSchools[4].id, title: '簡介會', description: '', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't5-2', school_id: supabaseMockSchools[4].id, title: '遞交申請', description: '', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't5-3', school_id: supabaseMockSchools[4].id, title: '第一次面試', description: '', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't5-4', school_id: supabaseMockSchools[4].id, title: '第二次面試', description: '', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null }
  ]),
  formatSchoolForFrontend(supabaseMockSchools[5], [
    { id: 't6-1', school_id: supabaseMockSchools[5].id, title: '簡介會', description: '', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't6-2', school_id: supabaseMockSchools[5].id, title: '遞交申請', description: '', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't6-3', school_id: supabaseMockSchools[5].id, title: '第一次面試', description: '', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null },
    { id: 't6-4', school_id: supabaseMockSchools[5].id, title: '第二次面試', description: '', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed: false, completed_at: null }
  ])
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    date: '2026-07-15',
    title: '幼稚園申請開始',
    type: 'kindergarten',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'e2',
    date: '2026-07-20',
    title: '小學入學申請',
    type: 'primary',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'e3',
    date: '2026-07-25',
    title: '幼稚園面試日期',
    type: 'kindergarten',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
