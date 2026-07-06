import type { ClassGroup, Subject } from '../types/domain';
import { slugId } from './userData';

export interface ApiUserSubject {
  subject_id?: string;
  subject_name?: string;
  year_level?: string;
  jenis_kelas?: string;
  class_names?: string[];
  class_ids?: string[];
}

/** Satu baris: kelas ini + subjek ini (kelas sama boleh dua baris, subjek berbeza). */
export interface TeachingSlot {
  slot_id: string;
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  year_level: string;
}

export interface ClassSubjectLine {
  id: string;
  classId: string;
  subjectName: string;
}

export function normalizeUserSubjects(raw: unknown[], classes: ClassGroup[]): Subject[] {
  const nameToId = new Map(classes.map((c) => [c.class_name, c.class_id]));

  const subjects: Subject[] = [];
  for (const row of raw) {
    const s = row as ApiUserSubject;
    const subjectName = String(s.subject_name || '').trim();
    if (!subjectName) continue;

    const classIds: string[] = [];
    const names = s.class_names || [];
    for (const n of names) {
      const id = nameToId.get(String(n).trim());
      if (id) classIds.push(id);
    }
    for (const id of s.class_ids || []) {
      const cid = String(id).trim();
      if (cid && !classIds.includes(cid)) classIds.push(cid);
    }

    const year = String(s.year_level || '').trim() || '—';
    const jenis = String(s.jenis_kelas || '').trim();
    const subjectId = String(s.subject_id || '').trim() || slugId(`${subjectName}-${year}-${jenis}`);

    subjects.push({
      subject_id: subjectId,
      subject_name: subjectName,
      year_level: year,
      jenis_kelas: jenis || undefined,
      class_ids: classIds,
      active: true,
    });
  }

  return subjects.sort((a, b) => a.subject_name.localeCompare(b.subject_name, 'ms'));
}

export function subjectsToTeachingSlots(subjects: Subject[], allClasses: ClassGroup[]): TeachingSlot[] {
  const byId = new Map(allClasses.map((c) => [c.class_id, c]));
  const slots: TeachingSlot[] = [];

  for (const s of subjects) {
    for (const cid of s.class_ids) {
      const c = byId.get(cid);
      if (!c) continue;
      slots.push({
        slot_id: slugId(`${s.subject_id}-${cid}`),
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        class_id: cid,
        class_name: c.class_name,
        year_level: c.year_level,
      });
    }
  }

  return slots.sort((a, b) => {
    const cmp = a.class_name.localeCompare(b.class_name, 'ms');
    return cmp !== 0 ? cmp : a.subject_name.localeCompare(b.subject_name, 'ms');
  });
}

export function filterTeachingClasses(allClasses: ClassGroup[], subjects: Subject[]): ClassGroup[] {
  const ids = new Set(subjects.flatMap((s) => s.class_ids));
  if (!ids.size) return [];
  return allClasses.filter((c) => ids.has(c.class_id));
}

export function linesFromSubjects(subjects: Subject[], allClasses: ClassGroup[]): ClassSubjectLine[] {
  const byId = new Map(allClasses.map((c) => [c.class_id, c]));
  const lines: ClassSubjectLine[] = [];

  for (const s of subjects) {
    for (const cid of s.class_ids) {
      if (!byId.has(cid)) continue;
      lines.push({
        id: slugId(`${s.subject_id}-${cid}`),
        classId: cid,
        subjectName: s.subject_name,
      });
    }
  }
  return lines;
}

/** Simpan: satu subjek sheet row per baris kelas+subjek. */
export function subjectsFromClassSubjectLines(lines: ClassSubjectLine[], allClasses: ClassGroup[]): Subject[] {
  const byId = new Map(allClasses.map((c) => [c.class_id, c]));

  return lines
    .filter((l) => l.classId && l.subjectName.trim())
    .map((l) => {
      const c = byId.get(l.classId);
      const name = l.subjectName.trim();
      return {
        subject_id: slugId(`${name}-${l.classId}`),
        subject_name: name,
        year_level: c?.year_level || '—',
        jenis_kelas: c?.jenis_kelas,
        class_ids: [l.classId],
        active: true,
      } satisfies Subject;
    });
}

export function subjectsToApiPayload(subjects: Subject[], classes: ClassGroup[]): ApiUserSubject[] {
  const idToName = new Map(classes.map((c) => [c.class_id, c.class_name]));
  return subjects.map((s) => ({
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    year_level: s.year_level,
    jenis_kelas: s.jenis_kelas || '',
    class_names: s.class_ids.map((id) => idToName.get(id) || id).filter(Boolean),
  }));
}

export function getClassesForSubject(
  subjectId: string,
  subjects: Subject[],
  teachingClasses: ClassGroup[],
): ClassGroup[] {
  const subject = subjects.find((s) => s.subject_id === subjectId);
  if (!subject?.class_ids.length) return teachingClasses;
  const set = new Set(subject.class_ids);
  return teachingClasses.filter((c) => set.has(c.class_id));
}

/** @deprecated import flow — guna Tetapan kelas+subjek */
export function proposeSubjectsFromImportRows(
  rows: { className: string; classType: string; yearLevel: string }[],
): { key: string; yearLevel: string; jenisKelas: string; classNames: string[]; subjectName: string }[] {
  const groups = new Map<string, { yearLevel: string; jenisKelas: string; classNames: Set<string> }>();

  for (const r of rows) {
    const yearLevel = r.yearLevel || '—';
    const jenisKelas = r.classType || '—';
    const key = `${yearLevel}||${jenisKelas}`;
    let g = groups.get(key);
    if (!g) {
      g = { yearLevel, jenisKelas, classNames: new Set() };
      groups.set(key, g);
    }
    g.classNames.add(r.className);
  }

  return [...groups.entries()].map(([key, g]) => ({
    key,
    yearLevel: g.yearLevel,
    jenisKelas: g.jenisKelas,
    classNames: [...g.classNames].sort((a, b) => a.localeCompare(b, 'ms')),
    subjectName: '',
  }));
}

export function proposeSubjectsFromClasses(classes: ClassGroup[]): ReturnType<typeof proposeSubjectsFromImportRows> {
  return proposeSubjectsFromImportRows(
    classes.map((c) => ({
      className: c.class_name,
      classType: c.jenis_kelas || '—',
      yearLevel: c.year_level || '—',
    })),
  );
}