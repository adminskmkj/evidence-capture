import type { ReactNode } from 'react';
import { NavTabs, type NavTabId } from './NavTabs';

interface LayoutProps {
  activeTab: NavTabId;
  children: ReactNode;
  onTabChange: (tabId: NavTabId) => void;
  userName?: string;
}

export function Layout({ activeTab, children, onTabChange, userName }: LayoutProps) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <div>
          <p className="eyebrow">Evidence Pentaksiran</p>
          <h1>Evidence Unit{userName ? ` · ${userName}` : ''}</h1>
        </div>
        <p className="app-header__summary">
          Simpan gambar bawah 500KB dan video evidence maksimum 90 saat dengan
          Google Drive + Google Sheets.
        </p>
      </header>

      <NavTabs activeTab={activeTab} onChange={onTabChange} />

      <main className="app-content">{children}</main>

      <footer className="app-footer">
        <p>MVP Evidence Pentaksiran</p>
      </footer>
    </div>
  );
}