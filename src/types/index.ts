export interface School {
  id: string;
  nameZh: string;
  nameEn: string;
  type: 'kindergarten' | 'primary';
  district: string;
  gender: 'coed' | 'boys' | 'girls';
  schoolNet: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  disabled: boolean;
}

export interface Event {
  id: string;
  date: Date;
  title: string;
  type: 'kindergarten' | 'primary';
}

export interface Student {
  id: string;
  name: string;
  birthDate: Date;
  applicationType: 'kindergarten' | 'primary';
  addedSchools: School[];
}
