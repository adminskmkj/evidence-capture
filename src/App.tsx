import { useState } from 'react';
import { Layout } from './components/Layout';
import type { NavTabId } from './components/NavTabs';
import { Dashboard } from './screens/Dashboard';
import { AddEvidence } from './screens/AddEvidence';

const tabTitles: Record<NavTabId, string> = {
  dashboard: 'Dashboard',
  'add-evidence': 'Tambah Evidence',
  gallery: 'Galeri',
  settings: 'Tetapan',
};

const tabDescriptions: Record<NavTabId, string> = {
  dashboard: 'Ringkasan data demo untuk subjek, kelas dan murid.',
  'add-evidence': 'Pilih subjek, kelas, murid dan isi maklumat evidence.',
  gallery: 'Placeholder untuk senarai evidence yang akan difilter.',
  settings: 'Placeholder untuk konfigurasi Google Apps Script dan import data.',
};

interface PendingEvidenceContext {
  subjectId?: string;
  classId?: string;
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
  const [pendingEvidenceContext, setPendingEvidenceContext] =
    useState<PendingEvidenceContext>();

  function handleStartEvidence(subjectId?: string, classId?: string) {
    setPendingEvidenceContext({ subjectId: subjectId || undefined, classId });
    setActiveTab('add-evidence');
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard evidenceThisMonth={0} onStartEvidence={handleStartEvidence} />;
      case 'add-evidence':
        return (
          <AddEvidence
            initialClassId={pendingEvidenceContext?.classId}
            initialSubjectId={pendingEvidenceContext?.subjectId}
          />
        );
      default:
        return <PlaceholderPanel tabId={activeTab} />;
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
