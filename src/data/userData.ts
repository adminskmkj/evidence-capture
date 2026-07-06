import type { ClassGroup, Student } from '../types/domain';
import { normalizeDarjahLabel } from './darjah';
import { canonicalClassKey, normalizeClassName, prefixClassNameWithYear } from '../utils/className';

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

  const upsertClass = (rawName: string, classType: string, year: string) => {
    const classNameWithYear = prefixClassNameWithYear(rawName, year);
    const className = normalizeClassName(classNameWithYear);
    if (!className) return;
    const metaKey = canonicalClassKey(className);
    const y = normalizeDarjahLabel(year, className);
    const existing = classMeta.get(metaKey);
    if (!existing) {
      classMeta.set(metaKey, {
        class_name: className,
        jenis_kelas: classType,
        year_level: y,
      });
      return;
    }
    if (!existing.jenis_kelas && classType) existing.jenis_kelas = classType;
    if (existing.year_level === '—' && y !== '—') existing.year_level = y;
  };

  for (const raw of apiClasses) {
    const c = raw as ApiUserClass;
    upsertClass(String(c.class_name || ''), String(c.class_type || '').trim(), String(c.year || ''));
  }

  const students: Student[] = [];
  const seenStudent = new Set<string>();

  for (const raw of apiStudents) {
    const s = raw as ApiUserStudent;
    const studentName = String(s.student_name || '').trim().replace(/\s+/g, ' ');
    const className = normalizeClassName(String(s.class_name || ''));
    if (!studentName || !className) continue;

    const dedupeKey = `${canonicalClassKey(className)}\x1f${studentName.toLowerCase()}`;
    if (seenStudent.has(dedupeKey)) continue;
    seenStudent.add(dedupeKey);

    upsertClass(className, '', '');

    const classId = slugId(className);
    students.push({
      student_id: `${classId}--${slugId(studentName)}`,
      student_name: studentName,
      class_id: classId,
      active: true,
    });
  }

  const classes: ClassGroup[] = Array.from(classMeta.values()).map((meta) => ({
    class_id: slugId(meta.class_name),
    class_name: meta.class_name,
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