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
    setError('');
    setPreview([]);

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

  function resetPicker() {
    setStatus('idle');
    setError('');
    setPreview([]);
    setCount(0);
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
          Fail macam JBA / senarai murid sekolah OK — app cari sendiri baris header{' '}
          <strong>NAMA</strong>, <strong>NAMA KELAS</strong>, <strong>JENIS KELAS</strong> (tak kena baris 1 pun boleh).
        </p>

        {status === 'processing' && <p className="capture-loading">Memproses fail...</p>}

        {(status === 'idle' || status === 'error') && (
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
            <button className="primary-action" onClick={resetPicker} type="button">
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

function normHeader(cell: unknown): string {
  return String(cell ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\.$/, '');
}

function colIndexForNama(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h === 'NAMA') return i;
    if (h.includes('NAMA MURID') && !h.includes('KELAS')) return i;
  }
  return -1;
}

function colIndexForKelas(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h === 'NAMA KELAS' || h === 'KELAS') return i;
  }
  return -1;
}

function colIndexForJenis(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'JENIS KELAS') return i;
  }
  return -1;
}

async function parseExcel(buf: ArrayBuffer): Promise<{ className: string; classType: string; studentName: string }[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][];

  let headerRowIdx = -1;
  let namaIdx = -1;
  let kelasIdx = -1;
  let jenisIdx = -1;

  const scanLimit = Math.min(matrix.length, 40);
  for (let r = 0; r < scanLimit; r++) {
    const row = matrix[r] || [];
    const headers = row.map(normHeader);
    const ni = colIndexForNama(headers);
    const ki = colIndexForKelas(headers);
    if (ni >= 0 && ki >= 0) {
      headerRowIdx = r;
      namaIdx = ni;
      kelasIdx = ki;
      jenisIdx = colIndexForJenis(headers);
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'Header NAMA / NAMA KELAS tidak dijumpai. Pastikan fail ada baris tajuk kolum (contoh fail JBA: baris dengan NAMA, NAMA KELAS).',
    );
  }

  const result: { className: string; classType: string; studentName: string }[] = [];

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const studentName = String(row[namaIdx] ?? '').trim();
    const className = String(row[kelasIdx] ?? '').trim();
    const classType = jenisIdx >= 0 ? String(row[jenisIdx] ?? '').trim() : '';

    if (!studentName || !className) continue;
    if (normHeader(studentName) === 'NAMA') continue;

    result.push({ className, classType, studentName });
  }

  if (!result.length) {
    throw new Error('Tiada murid dijumpai selepas baris header. Semak kolum NAMA dan NAMA KELAS ada data.');
  }

  return result;
}