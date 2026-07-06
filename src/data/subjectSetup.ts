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

/** Cadangan subjek dari baris Excel (selepas pilih kelas) — satu kumpulan per jenis + tahun. */
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

/** Cadangan dari kelas yang sudah disimpan (Tetapan → Jana dari kelas). */
export function proposeSubjectsFromClasses(classes: ClassGroup[]): ReturnType<typeof proposeSubjectsFromImportRows> {
  return proposeSubjectsFromImportRows(
    classes.map((c) => ({
      className: c.class_name,
      classType: c.jenis_kelas || '—',
      yearLevel: c.year_level || '—',
    })),
  );
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
  allClasses: ClassGroup[],
): ClassGroup[] {
  const subject = subjects.find((s) => s.subject_id === subjectId);
  if (!subject?.class_ids.length) return allClasses;
  const set = new Set(subject.class_ids);
  return allClasses.filter((c) => set.has(c.class_id));
}