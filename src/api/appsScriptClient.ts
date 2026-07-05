import type { EvidenceFormData } from '../components/EvidenceForm';
import type { CapturedImage } from '../components/ImageCapture';
import type { CapturedVideo } from '../components/VideoRecorder';
import type { BootstrapData, EvidenceItem, EvidenceType } from '../types/domain';

const APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/PLACEHOLDER/exec';

type ApiAction = 'getBootstrapData' | 'listEvidence' | 'uploadEvidence' | 'updateEvidence' | 'archiveEvidence';

interface ApiRequest {
  action: ApiAction;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  metadata?: Record<string, unknown>;
  evidence_id?: string;
  status?: string;
  file?: { name: string; mimeType: string; base64: string };
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Apps Script Web App redirects first POST (302) — fetch loses body on redirect.
// Use XMLHttpRequest which handles the redirect correctly.
function xhrPost<T>(payload: ApiRequest): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', APPS_SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'text/plain');

    xhr.onload = () => {
      try {
        const body: ApiResponse<T> = JSON.parse(xhr.responseText);
        resolve(body);
      } catch {
        resolve({ ok: false, error: 'Invalid response' });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: 'Rangkaian gagal' });
    xhr.ontimeout = () => resolve({ ok: false, error: 'Timeout' });
    xhr.timeout = 30000;
    xhr.send(JSON.stringify(payload));
  });
}

async function callApi<T = unknown>(payload: ApiRequest): Promise<ApiResponse<T>> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 25000);
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(id);
    if (resp.ok) {
      const body: ApiResponse<T> = await resp.json();
      return body;
    }
  } catch {
    // fall through
  }
  return xhrPost<T>(payload);
}

export async function getBootstrapData(): Promise<BootstrapData> {
  const resp = await callApi<BootstrapData>({ action: 'getBootstrapData' });
  if (!resp.ok || !resp.data) {
    const { bootstrapData } = await import('../data/seed');
    return bootstrapData;
  }
  return resp.data;
}

export interface ListEvidenceFilters {
  subject_id?: string;
  class_id?: string;
  student_id?: string;
  from?: string;
  to?: string;
  type?: EvidenceType;
}

export interface ListEvidenceResult {
  items: EvidenceItem[];
  nextOffset: number;
}

export async function listEvidence(
  filters: ListEvidenceFilters = {},
  limit = 20,
  offset = 0,
): Promise<ListEvidenceResult> {
  const resp = await callApi<ListEvidenceItem[]>({
    action: 'listEvidence',
    filters: filters as Record<string, unknown>,
    limit,
    offset,
  });
  if (!resp.ok || !resp.data) {
    return { items: [], nextOffset: 0 };
  }
  return { items: resp.data as unknown as EvidenceItem[], nextOffset: offset + limit };
}

export async function uploadEvidence(
  formData: EvidenceFormData,
  media: { type: 'image'; data: CapturedImage } | { type: 'video'; data: CapturedVideo },
): Promise<{ ok: boolean; evidence_id?: string; error?: string }> {
  const blob = media.type === 'image'
    ? media.data.blob
    : new Blob([media.data.blob], { type: 'video/webm' });

  const ext = media.type === 'image' ? 'jpg' : 'webm';
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '-');
  const fileName = `${dateStr}_${formData.subjectId}_${formData.classId}_${formData.activityTitle.replace(/\s+/g, '_')}_${media.type}.${ext}`;

  try {
    const base64 = await blobToBase64(blob);
    const resp = await callApi<{ evidence_id: string }>({
      action: 'uploadEvidence',
      metadata: {
        subject_id: formData.subjectId,
        class_id: formData.classId,
        student_ids: formData.studentIds,
        activity_title: formData.activityTitle.trim(),
        notes: formData.notes.trim(),
        evidence_type: media.type,
        file_name: fileName,
        mime_type: media.type === 'image' ? 'image/jpeg' : 'video/webm',
        file_size_bytes: media.data.sizeBytes,
        duration_seconds: media.type === 'video' ? media.data.durationSeconds : undefined,
      },
      file: {
        name: fileName,
        mimeType: media.type === 'image' ? 'image/jpeg' : 'video/webm',
        base64,
      },
    });

    return resp.ok
      ? { ok: true, evidence_id: resp.data?.evidence_id }
      : { ok: false, error: resp.error || 'Upload gagal' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ralat rangkaian' };
  }
}

interface ListEvidenceItem {
  evidence_id: string;
  created_at: string;
  subject_id: string;
  class_id: string;
  student_ids: string[];
  activity_title: string;
  notes: string;
  evidence_type: EvidenceType;
  file_name: string;
  file_id: string;
  file_url: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number;
  status: string;
}
