export type EvidenceType = 'image' | 'video';

export type EvidenceStatus = 'active' | 'archived';

export type CaptureState = 'idle' | 'preview' | 'uploading' | 'done';

export interface Subject {
  subject_id: string;
  subject_name: string;
  year_level: string;
  active: boolean;
}

export interface ClassGroup {
  class_id: string;
  class_name: string;
  year_level: string;
  active: boolean;
}

export interface Student {
  student_id: string;
  student_name: string;
  class_id: string;
  active: boolean;
}

export interface EvidenceItem {
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
  thumbnail_file_id?: string;
  thumbnail_url?: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number;
  status: EvidenceStatus;
  created_by?: string;
}

export interface EvidenceUploadMetadata {
  subject_id: string;
  class_id: string;
  student_ids: string[];
  activity_title: string;
  notes: string;
  evidence_type: EvidenceType;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number;
}

export interface EvidenceUploadPayload {
  action: 'uploadEvidence';
  metadata: EvidenceUploadMetadata;
  file: {
    name: string;
    mimeType: string;
    base64: string;
  };
}

export interface BootstrapData {
  subjects: Subject[];
  classes: ClassGroup[];
  students: Student[];
}
