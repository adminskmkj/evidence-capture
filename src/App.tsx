import { useState } from 'react';
import { Layout } from './components/Layout';
import type { NavTabId } from './components/NavTabs';
import { Dashboard } from './screens/Dashboard';
import { AddEvidence } from './screens/AddEvidence';
import { Gallery } from './screens/Gallery';
import { EvidenceDetail } from './screens/EvidenceDetail';
import { Settings } from './screens/Settings';
import { Login } from './components/Login';
import { ImportStudents } from './screens/ImportStudents';
import { getUser, login as apiLogin } from './api/appsScriptClient';
import type { EvidenceItem } from './types/domain';

interface PendingEvidenceContext { subjectId?: string; classId?: string }

function App() {
  const [user, setUser] = useState(getUser());
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [pendingEvidenceContext, setPendingEvidenceContext] = useState<PendingEvidenceContext>();
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [galleryTab, setGalleryTab] = useState<'list' | 'detail'>('list');

  if (!user) return <Login onLogin={handleLogin} />;

  async function handleLogin(name: string) {
    const resp = await apiLogin(name);
    if (resp.ok) {
      setUser(name);
      if (resp.newUser) setShowImport(true);
    } else {
      alert('Gagal log masuk: ' + (resp.error || 'Ralat'));
    }
  }

  function handleStartEvidence(subjectId?: string, classId?: string) {
    setPendingEvidenceContext({ subjectId: subjectId || undefined, classId });
    setActiveTab('add-evidence');
  }

  function handleViewEvidence(item: EvidenceItem) {
    setSelectedEvidence(item);
    setGalleryTab('detail');
  }

  function handleBackToGallery() {
    setSelectedEvidence(null);
    setGalleryTab('list');
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return <Dashboard evidenceThisMonth={0} onStartEvidence={handleStartEvidence} />;
      case 'add-evidence': return <AddEvidence initialClassId={pendingEvidenceContext?.classId} initialSubjectId={pendingEvidenceContext?.subjectId} />;
      case 'gallery':
        if (galleryTab === 'detail' && selectedEvidence) return <EvidenceDetail item={selectedEvidence} onBack={handleBackToGallery} />;
        return <Gallery onViewEvidence={handleViewEvidence} />;
      case 'settings': return <Settings />;
      default: return null;
    }
  }

  if (showImport) return <ImportStudents onDone={() => setShowImport(false)} />;

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
