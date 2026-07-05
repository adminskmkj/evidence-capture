import { useState } from 'react';
import { Layout } from './components/Layout';
import type { NavTabId } from './components/NavTabs';
import { Dashboard } from './screens/Dashboard';

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

interface PendingEvidenceContext {
  subjectId?: string;
  classId?: string;
}

function PlaceholderPanel({
  pendingEvidenceContext,
  tabId,
}: {
  pendingEvidenceContext?: PendingEvidenceContext;
  tabId: NavTabId;
}) {
  const hasPendingContext =
    tabId === 'add-evidence' &&
    Boolean(pendingEvidenceContext?.subjectId || pendingEvidenceContext?.classId);

  return (
    <section className="placeholder-panel">
      <p className="eyebrow">{tabTitles[tabId]}</p>
      <h2>{tabTitles[tabId]}</h2>
      <p>{tabDescriptions[tabId]}</p>
      {hasPendingContext ? (
        <p className="context-note">
          Shortcut dipilih: {pendingEvidenceContext?.subjectId || 'subjek belum dipilih'}
          {pendingEvidenceContext?.classId ? ` / ${pendingEvidenceContext.classId}` : ''}
        </p>
      ) : null}
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

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' ? (
        <Dashboard evidenceThisMonth={0} onStartEvidence={handleStartEvidence} />
      ) : (
        <PlaceholderPanel
          pendingEvidenceContext={pendingEvidenceContext}
          tabId={activeTab}
        />
      )}
    </Layout>
  );
}

export default App;
