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
import { UserDataProvider, useUserData } from './context/UserDataContext';
import { clearUser, getUser, login as apiLogin } from './api/appsScriptClient';
import type { EvidenceItem } from './types/domain';

interface PendingEvidenceContext { subjectId?: string; classId?: string }

function AppShell({ onLogout }: { onLogout: () => void }) {
  const user = getUser();
  const { refresh } = useUserData();
  const [showImport, setShowImport] = useState(() => sessionStorage.getItem('evidence_show_import') === '1');
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [pendingEvidenceContext, setPendingEvidenceContext] = useState<PendingEvidenceContext>();
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [galleryTab, setGalleryTab] = useState<'list' | 'detail'>('list');

  if (showImport) {
    return (
      <ImportStudents
        onDone={() => {
          sessionStorage.removeItem('evidence_show_import');
          void refresh();
          setShowImport(false);
        }}
      />
    );
  }

  function handleStartEvidence(subjectId?: string, classId?: string) {
    setPendingEvidenceContext({ subjectId: subjectId || undefined, classId });
    setActiveTab('add-evidence');
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            evidenceThisMonth={0}
            onOpenImport={() => setShowImport(true)}
            onStartEvidence={handleStartEvidence}
          />
        );
      case 'add-evidence':
        return (
          <AddEvidence
            initialClassId={pendingEvidenceContext?.classId}
            initialSubjectId={pendingEvidenceContext?.subjectId}
            onOpenImport={() => setShowImport(true)}
          />
        );
      case 'gallery':
        if (galleryTab === 'detail' && selectedEvidence) {
          return <EvidenceDetail item={selectedEvidence} onBack={() => { setSelectedEvidence(null); setGalleryTab('list'); }} />;
        }
        return <Gallery onViewEvidence={(item) => { setSelectedEvidence(item); setGalleryTab('detail'); }} />;
      case 'settings':
        return <Settings onLogout={onLogout} />;
      default:
        return null;
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} userName={user}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  const [user, setUser] = useState(getUser());

  async function handleLogin(name: string) {
    const resp = await apiLogin(name);
    if (resp.ok) {
      setUser(name);
      if (resp.newUser) sessionStorage.setItem('evidence_show_import', '1');
    } else {
      alert('Gagal log masuk: ' + (resp.error || 'Ralat'));
    }
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <UserDataProvider key={user} userName={user}>
      <AppShell onLogout={() => { clearUser(); setUser(''); }} />
    </UserDataProvider>
  );
}

export default App;