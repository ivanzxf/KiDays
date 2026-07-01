import { School, Event } from '@/types';

export const mockSchools: School[] = [
  {
    id: '1',
    nameZh: '香港幼稚園',
    nameEn: 'Hong Kong Kindergarten',
    type: 'kindergarten',
    district: '港島區',
    gender: 'coed',
    schoolNet: '11',
    tasks: [
      { id: 't1', title: '遞交申請', completed: false, disabled: false },
      { id: 't2', title: '遞交 Portfolio', completed: false, disabled: false },
      { id: 't3', title: '繳費', completed: false, disabled: true },
      { id: 't4', title: '第一次面試', completed: false, disabled: true },
      { id: 't5', title: '第二次面試', completed: false, disabled: true },
    ],
  },
  {
    id: '2',
    nameZh: '九龍小學',
    nameEn: 'Kowloon Primary School',
    type: 'primary',
    district: '九龍區',
    gender: 'boys',
    schoolNet: '41',
    tasks: [
      { id: 't1', title: '遞交申請', completed: true, disabled: false },
      { id: 't2', title: '遞交 Portfolio', completed: false, disabled: false },
      { id: 't3', title: '繳費', completed: false, disabled: false },
      { id: 't4', title: '面試', completed: false, disabled: true },
    ],
  },
  {
    id: '3',
    nameZh: '新界幼稚園',
    nameEn: 'New Territories Kindergarten',
    type: 'kindergarten',
    district: '新界區',
    gender: 'girls',
    schoolNet: '91',
    tasks: [
      { id: 't1', title: '遞交申請', completed: false, disabled: false },
      { id: 't2', title: '面試', completed: false, disabled: true },
    ],
  },
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    date: new Date(2026, 6, 15),
    title: '幼稚園申請開始',
    type: 'kindergarten',
  },
  {
    id: 'e2',
    date: new Date(2026, 6, 20),
    title: '小學入學申請',
    type: 'primary',
  },
  {
    id: 'e3',
    date: new Date(2026, 6, 25),
    title: '幼稚園面試日期',
    type: 'kindergarten',
  },
];
