export type NavTabId = 'dashboard' | 'add-evidence' | 'gallery' | 'settings';

export interface NavTab {
  id: NavTabId;
  label: string;
  description: string;
}

export const navTabs: NavTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Ringkasan subjek dan kelas',
  },
  {
    id: 'add-evidence',
    label: 'Tambah Evidence',
    description: 'Ambil gambar atau rakam video',
  },
  {
    id: 'gallery',
    label: 'Galeri',
    description: 'Cari dan lihat evidence',
  },
  {
    id: 'settings',
    label: 'Tetapan',
    description: 'Konfigurasi data dan sambungan',
  },
];
