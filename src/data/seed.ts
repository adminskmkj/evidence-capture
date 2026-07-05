import type { BootstrapData, ClassGroup, Student, Subject } from '../types/domain';

export interface SubjectClassLink {
  subject_id: string;
  class_id: string;
}

export const subjects: Subject[] = [
  {
    subject_id: 'muzik-t1',
    subject_name: 'Muzik Tahun 1',
    year_level: 'Tahun 1',
    active: true,
  },
  {
    subject_id: 'sains-t1',
    subject_name: 'Sains Tahun 1',
    year_level: 'Tahun 1',
    active: true,
  },
  {
    subject_id: 'psv-t2',
    subject_name: 'PSV Tahun 2',
    year_level: 'Tahun 2',
    active: true,
  },
  {
    subject_id: 'psv-t3',
    subject_name: 'PSV Tahun 3',
    year_level: 'Tahun 3',
    active: true,
  },
  {
    subject_id: 'sains-t3',
    subject_name: 'Sains Tahun 3',
    year_level: 'Tahun 3',
    active: true,
  },
];

export const classes: ClassGroup[] = [
  { class_id: '1-kelas-a', class_name: '1 Kelas A', year_level: 'Tahun 1', active: true },
  { class_id: '2-kelas-a', class_name: '2 Kelas A', year_level: 'Tahun 2', active: true },
  { class_id: '2-kelas-b', class_name: '2 Kelas B', year_level: 'Tahun 2', active: true },
  { class_id: '3-kelas-a', class_name: '3 Kelas A', year_level: 'Tahun 3', active: true },
  { class_id: '3-kelas-b', class_name: '3 Kelas B', year_level: 'Tahun 3', active: true },
  { class_id: '3-kelas-c', class_name: '3 Kelas C', year_level: 'Tahun 3', active: true },
  { class_id: '3-kelas-d', class_name: '3 Kelas D', year_level: 'Tahun 3', active: true },
  { class_id: '3-kelas-e', class_name: '3 Kelas E', year_level: 'Tahun 3', active: true },
  { class_id: '3-kelas-f', class_name: '3 Kelas F', year_level: 'Tahun 3', active: true },
];

export const subjectClassLinks: SubjectClassLink[] = [
  { subject_id: 'muzik-t1', class_id: '1-kelas-a' },
  { subject_id: 'sains-t1', class_id: '1-kelas-a' },
  { subject_id: 'psv-t2', class_id: '2-kelas-a' },
  { subject_id: 'psv-t2', class_id: '2-kelas-b' },
  { subject_id: 'psv-t3', class_id: '3-kelas-a' },
  { subject_id: 'sains-t3', class_id: '3-kelas-a' },
  { subject_id: 'sains-t3', class_id: '3-kelas-b' },
  { subject_id: 'sains-t3', class_id: '3-kelas-c' },
  { subject_id: 'sains-t3', class_id: '3-kelas-d' },
  { subject_id: 'sains-t3', class_id: '3-kelas-e' },
  { subject_id: 'sains-t3', class_id: '3-kelas-f' },
];

const demoNames = ['Ali', 'Siti', 'Aiman', 'Nurul', 'Kumar', 'Mei Lin'];

export const students: Student[] = classes.flatMap((classGroup) =>
  demoNames.map((name, index) => ({
    student_id: `${classGroup.class_id}-murid-${String(index + 1).padStart(2, '0')}`,
    student_name: `${name} ${classGroup.class_name}`,
    class_id: classGroup.class_id,
    active: true,
  })),
);

export const bootstrapData: BootstrapData = {
  subjects,
  classes,
  students,
};

export function getClassesForSubject(subjectId: string): ClassGroup[] {
  const classIds = subjectClassLinks
    .filter((link) => link.subject_id === subjectId)
    .map((link) => link.class_id);

  return classes.filter((classGroup) => classIds.includes(classGroup.class_id));
}

export function getStudentsByClassId(classId: string): Student[] {
  return students.filter((student) => student.class_id === classId);
}

export function countStudentsByClassId(classId: string): number {
  return getStudentsByClassId(classId).length;
}
