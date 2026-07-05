import type { EvidenceFormData } from '../components/EvidenceForm';
import type { CapturedImage } from '../components/ImageCapture';
import type { CapturedVideo } from '../components/VideoRecorder';
import type { EvidenceItem, EvidenceType } from '../types/domain';

const APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/PLACEHOLDER/exec';

let _userName = '';

export function setUser(name: string) { _userName = name; localStorage.setItem('evidence_user', name); }
export function getUser(): string {
  if (!_userName) _userName = localStorage.getItem('evidence_user') || '';
  return _userName;
}

function xhrPost(payload: Record<string, unknown>, skipUser = false): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', APPS_SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({ ok: false, error: 'Invalid response' }); } };
    xhr.onerror = () => resolve({ ok: false, error: 'Rangkaian gagal' });
    xhr.ontimeout = () => resolve({ ok: false, error: 'Timeout' });
    xhr.timeout = 30000;
    if (!skipUser) payload.userName = getUser();
    xhr.send(JSON.stringify(payload));
  });
}

export async function login(name: string): Promise<{ ok: boolean; newUser?: boolean; classes?: unknown[]; students?: unknown[]; error?: string }> {
  const resp = await xhrPost({ action: 'login', userName: name }, true);
  if (resp.ok) {
    setUser(name);
    return { ok: true, newUser: !!resp.newUser, classes: resp.classes as unknown[], students: resp.students as unknown[] };
  }
  return { ok: false, error: resp.error as string };
}

export async function getBootstrapData(): Promise<{ classes: unknown[]; students: unknown[] }> {
  const resp = await xhrPost({ action: 'getBootstrapData' });
  if (resp.ok) return { classes: resp.classes as unknown[] || [], students: resp.students as unknown[] || [] };
  return { classes: [], students: [] };
}

export async function uploadStudents(rows: { className: string; classType: string; studentName: string }[]) {
  const resp = await xhrPost({ action: 'uploadStudents', rows });
  return { ok: !!resp.ok, count: (resp.count as number) || 0, error: resp.error as string };
}

export interface ListEvidenceFilters {
  subject_id?: string; class_id?: string; student_id?: string; from?: string; to?: string; type?: EvidenceType;
}
export interface ListEvidenceResult { items: EvidenceItem[]; nextOffset: number }

export async function listEvidence(filters: ListEvidenceFilters = {}, limit = 20, offset = 0): Promise<ListEvidenceResult> {
  const resp = await xhrPost({ action: 'listEvidence', filters: filters as Record<string, unknown>, limit, offset });
  if (!resp.ok || !resp.items) return { items: [], nextOffset: 0 };
  return { items: resp.items as EvidenceItem[], nextOffset: (resp.nextOffset as number) || 0 };
}

export async function uploadEvidence(
  formData: EvidenceFormData,
  media: { type: 'image'; data: CapturedImage } | { type: 'video'; data: CapturedVideo },
): Promise<{ ok: boolean; evidence_id?: string; error?: string }> {
  const blob = media.type === 'image' ? media.data.blob : new Blob([media.data.blob], { type: 'video/webm' });
  const ext = media.type === 'image' ? 'jpg' : 'webm';
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '-');
  const fileName = `${dateStr}_${formData.subjectId}_${formData.classId}_${formData.activityTitle.replace(/\s+/g, '_')}_${media.type}.${ext}`;

  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    const resp = await xhrPost({
      action: 'uploadEvidence',
      metadata: {
        subject_id: formData.subjectId, class_id: formData.classId, student_ids: formData.studentIds,
        activity_title: formData.activityTitle.trim(), notes: formData.notes.trim(),
        evidence_type: media.type, file_name: fileName, mime_type: media.type === 'image' ? 'image/jpeg' : 'video/webm',
        file_size_bytes: media.data.sizeBytes, duration_seconds: media.type === 'video' ? media.data.durationSeconds : undefined,
      },
      file: { name: fileName, mimeType: media.type === 'image' ? 'image/jpeg' : 'video/webm', base64 },
    });
    return resp.ok ? { ok: true, evidence_id: resp.evidence_id as string } : { ok: false, error: (resp.error as string) || 'Upload gagal' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ralat rangkaian' };
  }
}
