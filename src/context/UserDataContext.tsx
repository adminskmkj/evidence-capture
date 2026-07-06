import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBootstrapData } from '../api/appsScriptClient';
import { countStudentsInClass, normalizeUserBootstrap } from '../data/userData';
import { subjects } from '../data/seed';
import type { ClassGroup, Student } from '../types/domain';

interface UserDataContextValue {
  loading: boolean;
  error: string;
  classes: ClassGroup[];
  students: Student[];
  subjects: typeof subjects;
  refresh: () => Promise<void>;
  getStudentsByClassId: (classId: string) => Student[];
  countStudentsByClassId: (classId: string) => number;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

async function fetchUserData(): Promise<{ classes: ClassGroup[]; students: Student[]; error: string }> {
  const resp = await getBootstrapData();
  const normalized = normalizeUserBootstrap(resp.classes, resp.students);
  const error = !normalized.classes.length
    ? 'Tiada kelas lagi. Muat naik senarai murid dalam Tetapan.'
    : '';
  return { ...normalized, error };
}

export function UserDataProvider({ userName, children }: { userName: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const refresh = useCallback(async () => {
    if (!userName) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchUserData();
      setClasses(data.classes);
      setStudents(data.students);
      setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal muat data pengguna');
      setClasses([]);
      setStudents([]);
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
        setError(data.error);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal muat data pengguna');
        setClasses([]);
        setStudents([]);
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
  }), [loading, error, classes, students, refresh]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}