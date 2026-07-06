import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBootstrapData } from '../api/appsScriptClient';
import { normalizeUserSubjects } from '../data/subjectSetup';
import { countStudentsInClass, normalizeUserBootstrap } from '../data/userData';
import type { ClassGroup, Student, Subject } from '../types/domain';

interface UserDataContextValue {
  loading: boolean;
  error: string;
  classes: ClassGroup[];
  students: Student[];
  subjects: Subject[];
  refresh: () => Promise<void>;
  getStudentsByClassId: (classId: string) => Student[];
  countStudentsByClassId: (classId: string) => number;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

async function fetchUserData(): Promise<{
  classes: ClassGroup[];
  students: Student[];
  subjects: Subject[];
  error: string;
}> {
  const resp = await getBootstrapData();
  const normalized = normalizeUserBootstrap(resp.classes, resp.students);
  const subjects = normalizeUserSubjects(resp.subjects, normalized.classes);

  let error = '';
  if (!normalized.classes.length) {
    error = 'Tiada kelas lagi. Muat naik senarai murid dalam Tetapan.';
  } else if (!subjects.length) {
    error = 'Tiada subjek lagi. Setup subjek dalam Tetapan (jana dari kelas import).';
  }

  return { ...normalized, subjects, error };
}

export function UserDataProvider({ userName, children }: { userName: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const refresh = useCallback(async () => {
    if (!userName) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchUserData();
      setClasses(data.classes);
      setStudents(data.students);
      setSubjects(data.subjects);
      setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal muat data pengguna');
      setClasses([]);
      setStudents([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  useEffect(() => {
    if (!userName) return;
    let cancelled = false;
    fetchUserData()
      .then((data) => {
        if (cancelled) return;
        setClasses(data.classes);
        setStudents(data.students);
        setSubjects(data.subjects);
        setError(data.error);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal muat data pengguna');
        setClasses([]);
        setStudents([]);
        setSubjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userName]);

  const value = useMemo<UserDataContextValue>(() => ({
    loading,
    error,
    classes,
    students,
    subjects,
    refresh,
    getStudentsByClassId: (classId: string) => students.filter((s) => s.class_id === classId),
    countStudentsByClassId: (classId: string) => countStudentsInClass(students, classId),
  }), [loading, error, classes, students, subjects, refresh]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}