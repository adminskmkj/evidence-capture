import { useState } from 'react';
import { uploadStudents } from '../api/appsScriptClient';

interface ImportStudentsProps {
  onDone: () => void;
}

export function ImportStudents({ onDone }: ImportStudentsProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ className: string; classType: string; studentName: string }[]>([]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('processing');

    try {
      const buf = await file.arrayBuffer();

      const result = await parseExcel(buf);
      setPreview(result.slice(0, 20));
      setCount(result.length);

      const resp = await uploadStudents(result);
      if (resp.ok) {
        setStatus('done');
      } else {
        setError(resp.error || 'Gagal upload');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat baca fail');
      setStatus('error');
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="eyebrow">Import Murid</p>
        <h1>Muat Naik Senarai Murid</h1>
        <p className="hero-copy">
          Ini kali pertama anda. Muat naik senarai murid dari fail Excel (.xlsx).
        </p>
        <p className="login-warning">
          Pastikan fail ada kolum: <strong>NAMA</strong>, <strong>NAMA KELAS</strong>, <strong>JENIS KELAS</strong>.
        </p>

        {status === 'processing' && <p className="capture-loading">Memproses fail...</p>}

        {status === 'idle' && (
          <label className="primary-action" style={{ textAlign: 'center', cursor: 'pointer' }}>
            Pilih Fail Excel
            <input accept=".xlsx,.xls" hidden onChange={handleFile} type="file" />
          </label>
        )}

        {preview.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p className="context-note">{count} murid dijumpai. Preview 20 pertama:</p>
            <div style={{ maxHeight: 200, overflow: 'auto', border: '2px solid var(--border)', marginTop: '0.5rem' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={th}>Kelas</th>
                    <th style={th}>Jenis</th>
                    <th style={th}>Nama</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={td}>{r.className}</td>
                      <td style={td}>{r.classType}</td>
                      <td style={td}>{r.studentName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === 'done' && (
          <>
            <p className="context-note">✅ {count} murid berjaya diimport!</p>
            <button className="primary-action" onClick={onDone} type="button">
              Mula Guna App
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="capture-error">{error}</p>
            <button className="primary-action" onClick={() => setStatus('idle')} type="button">
              Cuba Lagi
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '0.4rem', textAlign: 'left', fontWeight: 800, borderBottom: '2px solid var(--border)' };
const td: React.CSSProperties = { padding: '0.3rem 0.4rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

async function parseExcel(buf: ArrayBuffer): Promise<{ className: string; classType: string; studentName: string }[]> {
  // Use SheetJS via CDN or dynamic import
  // For now, use a simple approach with xlsx
  const XLSX = await import('xlsx');
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  // Find headers
  const firstRow = rows[0] || {};
  const headers = Object.keys(firstRow).map((k) => k.trim().toUpperCase());

  let namaIdx = -1, kelasIdx = -1, jenisIdx = -1;

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h === 'NAMA' || h.includes('NAMA MURID')) namaIdx = i;
    if (h === 'NAMA KELAS' || h === 'KELAS') kelasIdx = i;
    if (h === 'JENIS KELAS') jenisIdx = i;
  }

  if (namaIdx === -1 || kelasIdx === -1) throw new Error('Header NAMA / NAMA KELAS tidak dijumpai');

  const result: { className: string; classType: string; studentName: string }[] = [];

  for (const row of rows) {
    const vals = Object.values(row);
    const studentName = String(vals[namaIdx] || '').trim();
    const className = String(vals[kelasIdx] || '').trim();
    const classType = jenisIdx >= 0 ? String(vals[jenisIdx] || '').trim() : '';

    if (studentName && className) {
      result.push({ className, classType, studentName });
    }
  }

  return result;
}
