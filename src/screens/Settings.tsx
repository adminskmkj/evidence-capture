import { useState } from 'react';
import { MAX_IMAGE_BYTES } from '../media/imageCompression';
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '../media/videoRecorder';
import { getUser } from '../api/appsScriptClient';
import { useUserData } from '../context/UserDataContext';
import { ImportStudents } from './ImportStudents';

interface SettingsProps {
  onLogout?: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const user = getUser();
  const { loading, classes, students, refresh, error } = useUserData();
  const [showImport, setShowImport] = useState(false);

  if (showImport) {
    return (
      <ImportStudents
        onDone={() => {
          setShowImport(false);
          void refresh();
        }}
      />
    );
  }

  return (
    <section>
      <div className="form-header">
        <p className="eyebrow">Tetapan</p>
        <h2>Akaun &amp; Senarai Murid</h2>
      </div>

      <div className="capture-panel">
        <h3>Pengguna</h3>
        <dl className="evidence-meta">
          <dt>Nama log masuk</dt>
          <dd><strong>{user || '—'}</strong></dd>
          <dt>Google Sheet</dt>
          <dd>Tab <code>{user || '…'}</code> (kelas + murid anda)</dd>
        </dl>
        <p className="login-warning" style={{ marginTop: '0.75rem' }}>
          Guna nama yang sama setiap kali log masuk. Tab <strong>Students</strong> / <strong>Classes</strong> lama ialah data demo — app tidak guna lagi.
        </p>
        {onLogout && (
          <button className="secondary-action" onClick={onLogout} style={{ marginTop: '0.75rem' }} type="button">
            Log keluar (nama dalam peranti)
          </button>
        )}
      </div>

      <div className="capture-panel" style={{ marginTop: '1rem' }}>
        <h3>Senarai murid &amp; kelas</h3>
        <dl className="evidence-meta">
          <dt>Kelas</dt>
          <dd>{loading ? '…' : classes.length}</dd>
          <dt>Murid</dt>
          <dd>{loading ? '…' : students.length}</dd>
        </dl>
        {error && <p className="capture-error">{error}</p>}
        <p className="context-note">
          Kelas <strong>wujud automatik</strong> daripada kolum <strong>NAMA KELAS</strong> dalam fail Excel (contoh JBA).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button className="primary-action" onClick={() => setShowImport(true)} type="button">
            Muat naik / kemaskini Excel
          </button>
          <button className="secondary-action" onClick={() => void refresh()} type="button">
            Segarkan dari Sheet
          </button>
        </div>
        {!loading && classes.length > 0 && (
          <ul style={{ marginTop: '1rem', paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
            {classes.slice(0, 15).map((c) => (
              <li key={c.class_id}>{c.class_name}</li>
            ))}
            {classes.length > 15 && <li>… +{classes.length - 15} kelas lagi</li>}
          </ul>
        )}
      </div>

      <div className="capture-panel" style={{ marginTop: '1rem' }}>
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
          <dd style={{ wordBreak: 'break-all' }}>{import.meta.env.VITE_APPS_SCRIPT_URL || 'Tidak diset'}</dd>
        </dl>
      </div>
    </section>
  );
}