export interface Student {
  id: number;
  name: string;
  birth_date: string;
  enrollment_no: string;
  grade: string;
  father_name: string;
  mother_name: string;
  address: string;
  phone_no: string;
  guardian_name: string;
  notes: string;
  created_at: string;
}

export type NewStudent = Omit<Student, 'id' | 'created_at'>;
