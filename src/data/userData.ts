import type { ClassGroup, Student } from '../types/domain';
import { normalizeDarjahLabel } from './darjah';

export interface ApiUserClass {
  class_name?: string;
  class_type?: string;
  year?: string;
}

export interface ApiUserStudent {
  student_name?: string;
  class_name?: string;
}

export function slugId(text: string): string {
  const base = String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'item';
}

export function normalizeUserBootstrap(
  apiClasses: unknown[],
  apiStudents: unknown[],
): { classes: ClassGroup[]; students: Student[] } {
  const classMeta = new Map<string, { class_name: string; jenis_kelas: string; year_level: string }>();

  for (const raw of apiClasses) {
    const c = raw as ApiUserClass;
    const className = String(c.class_name || '').trim();
    if (!className) continue;
    if (!classMeta.has(className)) {
      classMeta.set(className, {
        class_name: className,
        jenis_kelas: String(c.class_type || '').trim(),
        year_level: normalizeDarjahLabel(String(c.year || ''), className),
      });
    } else if (classMeta.get(className)!.year_level === '—') {
      const meta = classMeta.get(className)!;
      const y = normalizeDarjahLabel(String(c.year || ''), className);
      if (y !== '—') meta.year_level = y;
    }
  }

  const students: Student[] = [];
  const seenStudent = new Set<string>();

  for (const raw of apiStudents) {
    const s = raw as ApiUserStudent;
    const studentName = String(s.student_name || '').trim().replace(/\s+/g, ' ');
    const className = String(s.class_name || '').trim().replace(/\s+/g, ' ');
    if (!studentName || !className) continue;

    const dedupeKey = `${className.toLowerCase()}\x1f${studentName.toLowerCase()}`;
    if (seenStudent.has(dedupeKey)) continue;
    seenStudent.add(dedupeKey);

    if (!classMeta.has(className)) {
      classMeta.set(className, {
        class_name: className,
        jenis_kelas: '',
        year_level: normalizeDarjahLabel('', className),
      });
    }

    const classId = slugId(className);
    const studentId = `${classId}--${slugId(studentName)}`;
    students.push({
      student_id: studentId,
      student_name: studentName,
      class_id: classId,
      active: true,
    });
  }

  const classes: ClassGroup[] = Array.from(classMeta.entries()).map(([className, meta]) => ({
    class_id: slugId(className),
    class_name: className,
    year_level: meta.year_level,
    jenis_kelas: meta.jenis_kelas || undefined,
    active: true,
  }));

  classes.sort((a, b) => a.class_name.localeCompare(b.class_name, 'ms'));

  return { classes, students };
}

export function countStudentsInClass(students: Student[], classId: string): number {
  return students.filter((s) => s.class_id === classId).length;
}