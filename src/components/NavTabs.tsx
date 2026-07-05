import { navTabs, type NavTabId } from '../navigation/tabs';

interface NavTabsProps {
  activeTab: NavTabId;
  onChange: (tabId: NavTabId) => void;
}

export function NavTabs({ activeTab, onChange }: NavTabsProps) {
  return (
    <nav className="nav-tabs" aria-label="Navigasi utama">
      {navTabs.map((tab) => (
        <button
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className="nav-tab"
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          <span>{tab.label}</span>
          <small>{tab.description}</small>
        </button>
      ))}
    </nav>
  );
}

export type { NavTabId };
