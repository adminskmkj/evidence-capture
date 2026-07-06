import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBootstrapData } from '../api/appsScriptClient';
import {
  filterTeachingClasses,
  normalizeUserSubjects,
  subjectsToTeachingSlots,
  type TeachingSlot,
} from '../data/subjectSetup';
import { countStudentsInClass, normalizeUserBootstrap } from '../data/userData';
import type { ClassGroup, Student, Subject } from '../types/domain';

interface UserDataContextValue {
  loading: boolean;
  error: string;
  /** Kelas dalam Sheet (semua dari import). */
  allClasses: ClassGroup[];
  /** Hanya kelas dalam setup anda. */
  classes: ClassGroup[];
  students: Student[];
  subjects: Subject[];
  teachingSlots: TeachingSlot[];
  refresh: () => Promise<void>;
  getStudentsByClassId: (classId: string) => Student[];
  countStudentsByClassId: (classId: string) => number;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

async function fetchUserData(): Promise<{
  allClasses: ClassGroup[];
  classes: ClassGroup[];
  students: Student[];
  subjects: Subject[];
  teachingSlots: TeachingSlot[];
  error: string;
}> {
  const resp = await getBootstrapData();
  const normalized = normalizeUserBootstrap(resp.classes, resp.students);
  const subjects = normalizeUserSubjects(resp.subjects, normalized.classes);
  const teachingClasses = filterTeachingClasses(normalized.classes, subjects);
  const teachingSlots = subjectsToTeachingSlots(subjects, normalized.classes);

  let error = '';
  if (!normalized.classes.length) {
    error = 'Tiada kelas dalam Sheet. Muat naik senarai murid (Excel) dalam Tetapan.';
  } else if (!teachingClasses.length) {
    error = 'Setup kelas & subjek dalam Tetapan — pilih kelas yang anda ajar (bukan semua kelas Sheet).';
  }

  return {
    allClasses: normalized.classes,
    classes: teachingClasses,
    students: normalized.students,
    subjects,
    teachingSlots,
    error,
  };
}

export function UserDataProvider({ userName, children }: { userName: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allClasses, setAllClasses] = useState<ClassGroup[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachingSlots, setTeachingSlots] = useState<TeachingSlot[]>([]);

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchUserData>>) => {
    setAllClasses(data.allClasses);
    setClasses(data.classes);
    setStudents(data.students);
    setSubjects(data.subjects);
    setTeachingSlots(data.teachingSlots);
    setError(data.error);
  }, []);

  const refresh = useCallback(async () => {
    if (!userName) return;
    setLoading(true);
    setError('');
    try {
      applyData(await fetchUserData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal muat data pengguna');
      setAllClasses([]);
      setClasses([]);
      setStudents([]);
      setSubjects([]);
      setTeachingSlots([]);
    } finally {
      setLoading(false);
    }
  }, [userName, applyData]);

  useEffect(() => {
    if (!userName) return;
    let cancelled = false;
    fetchUserData()
      .then((data) => {
        if (!cancelled) applyData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal muat data pengguna');
        setAllClasses([]);
        setClasses([]);
        setStudents([]);
        setSubjects([]);
        setTeachingSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userName, applyData]);

  const value = useMemo<UserDataContextValue>(() => ({
    loading,
    error,
    allClasses,
    classes,
    students,
    subjects,
    teachingSlots,
    refresh,
    getStudentsByClassId: (classId: string) => students.filter((s) => s.class_id === classId),
    countStudentsByClassId: (classId: string) => countStudentsInClass(students, classId),
  }), [loading, error, allClasses, classes, students, subjects, teachingSlots, refresh]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}