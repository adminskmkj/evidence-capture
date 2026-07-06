import { useState } from 'react';
import { MAX_IMAGE_BYTES } from '../media/imageCompression';
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '../media/videoRecorder';
import { getUser } from '../api/appsScriptClient';
import { useUserData } from '../context/UserDataContext';
import { SubjectSetupPanel } from '../components/SubjectSetupPanel';
import { ImportStudents } from './ImportStudents';

interface SettingsProps {
  onLogout?: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const user = getUser();
  const { loading, classes, students, subjects, refresh, error } = useUserData();
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
        <h2>Akaun, murid &amp; subjek</h2>
      </div>

      <div className="capture-panel">
        <h3>Pengguna</h3>
        <dl className="evidence-meta">
          <dt>Nama log masuk</dt>
          <dd><strong>{user || '—'}</strong></dd>
          <dt>Google Sheet</dt>
          <dd>Tab <code>{user || '…'}</code> (murid) + <code>SubjekPengguna</code> (subjek anda)</dd>
        </dl>
        {onLogout && (
          <button className="secondary-action" onClick={onLogout} style={{ marginTop: '0.75rem' }} type="button">
            Log keluar
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
        {error && error.includes('kelas') && <p className="capture-error">{error}</p>}
        <p className="context-note">
          Pilih kelas yang anda ajar sahaja semasa import Excel (elak timeout).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button className="primary-action" onClick={() => setShowImport(true)} type="button">
            Muat naik / kemaskini Excel
          </button>
          <button className="secondary-action" onClick={() => void refresh()} type="button">
            Segarkan dari Sheet
          </button>
        </div>
      </div>

      <div className="capture-panel" style={{ marginTop: '1rem' }}>
        <h3>Setup subjek (per guru)</h3>
        <p className="context-note" style={{ marginBottom: '0.75rem' }}>
          Subjek: <strong>{loading ? '…' : subjects.length}</strong> — setiap cikgu lain. Jana sekali dari kumpulan kelas (JENIS + TAHUN dari Excel).
        </p>
        <SubjectSetupPanel
          classes={classes}
          existingSubjects={subjects}
          onSaved={() => void refresh()}
        />
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
    </section>
  );
}