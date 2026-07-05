import { useState } from 'react';
import { classes, countStudentsByClassId, getClassesForSubject, subjects } from './data/seed';
import { Layout } from './components/Layout';
import type { NavTabId } from './components/NavTabs';

const tabTitles: Record<NavTabId, string> = {
  dashboard: 'Dashboard',
  'add-evidence': 'Tambah Evidence',
  gallery: 'Galeri',
  settings: 'Tetapan',
};

const tabDescriptions: Record<NavTabId, string> = {
  dashboard: 'Ringkasan data demo untuk subjek, kelas dan murid.',
  'add-evidence': 'Placeholder untuk form evidence dalam task seterusnya.',
  gallery: 'Placeholder untuk senarai evidence yang akan difilter.',
  settings: 'Placeholder untuk konfigurasi Google Apps Script dan import data.',
};

function DashboardPreview() {
  return (
    <>
      <section className="hero-card">
        <p className="eyebrow">Data Demo</p>
        <h2>Simpan evidence gambar dan video pendek dengan tersusun.</h2>
        <p className="hero-copy">
          MVP ini akan menyokong gambar bawah 500KB, video maksimum 90 saat,
          Google Drive untuk media, dan Google Sheets untuk metadata.
        </p>

        <div className="seed-summary" aria-label="Ringkasan data demo">
          <div>
            <strong>{subjects.length}</strong>
            <span>subjek</span>
          </div>
          <div>
            <strong>{classes.length}</strong>
            <span>kelas</span>
          </div>
        </div>
      </section>

      <section className="subject-grid" aria-label="Senarai subjek dan kelas demo">
        {subjects.map((subject) => (
          <article className="subject-card" key={subject.subject_id}>
            <p className="subject-year">{subject.year_level}</p>
            <h3>{subject.subject_name}</h3>
            <ul>
              {getClassesForSubject(subject.subject_id).map((classGroup) => (
                <li key={classGroup.class_id}>
                  <span>{classGroup.class_name}</span>
                  <small>{countStudentsByClassId(classGroup.class_id)} murid demo</small>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </>
  );
}

function PlaceholderPanel({ tabId }: { tabId: NavTabId }) {
  return (
    <section className="placeholder-panel">
      <p className="eyebrow">{tabTitles[tabId]}</p>
      <h2>{tabTitles[tabId]}</h2>
      <p>{tabDescriptions[tabId]}</p>
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' ? <DashboardPreview /> : <PlaceholderPanel tabId={activeTab} />}
    </Layout>
  );
}

export default App;
