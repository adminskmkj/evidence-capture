import { MAX_IMAGE_BYTES } from '../media/imageCompression';
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '../media/videoRecorder';

interface SettingsProps {
  appsScriptUrl?: string;
}

export function Settings({ appsScriptUrl }: SettingsProps) {
  return (
    <section>
      <div className="form-header">
        <p className="eyebrow">Tetapan</p>
        <h2>Konfigurasi dan Had Media</h2>
      </div>

      <div className="capture-panel">
        <h3>Had Media</h3>
        <dl className="evidence-meta">
          <dt>Gambar maksimum</dt>
          <dd>{MAX_IMAGE_BYTES / 1024} KB</dd>

          <dt>Video maksimum</dt>
          <dd>{MAX_VIDEO_BYTES / 1024 / 1024} MB</dd>

          <dt>Durasi video maksimum</dt>
          <dd>{MAX_VIDEO_SECONDS} saat</dd>
        </dl>
      </div>

      <div className="capture-panel" style={{ marginTop: '1rem' }}>
        <h3>Apps Script</h3>
        <dl className="evidence-meta">
          <dt>Endpoint</dt>
          <dd>{appsScriptUrl || import.meta.env.VITE_APPS_SCRIPT_URL || 'Tidak diset'}</dd>
        </dl>
      </div>

      <div className="capture-panel" style={{ marginTop: '1rem' }}>
        <h3>Import Data Murid (Fasa 2)</h3>
        <p>
          Untuk import data murid dari CSV, format yang diperlukan:
        </p>
        <pre className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
{`student_name,class_id
Ali,3-kelas-a
Siti,3-kelas-a`}</pre>
        <p className="context-note">
          Import CSV akan datang dalam fasa seterusnya. Buat masa ini, data murid
          boleh ditambah secara manual dalam Google Sheet EvidenceDB tab Students.
        </p>
      </div>
    </section>
  );
}
