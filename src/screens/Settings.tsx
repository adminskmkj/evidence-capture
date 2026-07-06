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
  const { loading, allClasses, classes, students, subjects, teachingSlots, refresh, error } = useUserData();
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
        <h3>Setup kelas &amp; subjek</h3>
        <p className="context-note" style={{ marginBottom: '0.75rem' }}>
          <strong>Tiada popup.</strong> Butang D1–D6 / PRA + senarai kelas terus di bawah. Versi UI:{' '}
          <code>2026-07-06b</code>
        </p>
        <SubjectSetupPanel
          key={teachingSlots.map((s) => s.slot_id).join('|') || 'empty'}
          allClasses={allClasses}
          existingSubjects={subjects}
          onSaved={() => void refresh()}
        />
      </div>

      <div className="capture-panel" style={{ marginTop: '1rem' }}>
        <h3>Senarai murid &amp; kelas</h3>
        <dl className="evidence-meta">
          <dt>Kelas dalam Sheet</dt>
          <dd>{loading ? '…' : allClasses.length}</dd>
          <dt>Kelas anda ajar (setup)</dt>
          <dd>{loading ? '…' : classes.length}</dd>
          <dt>Murid (semua dalam Sheet)</dt>
          <dd>{loading ? '…' : students.length}</dd>
        </dl>
        {error && <p className="capture-error">{error}</p>}
        <p className="context-note">
          Import boleh masukkan banyak kelas sekaligus. Kelas yang dipaparkan dalam app = yang anda setup di bawah.
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