import { useState } from 'react';

interface LoginProps {
  onLogin: (name: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Sila masukkan nama anda');
      return;
    }
    if (trimmed.length < 3) {
      setError('Nama mesti sekurang-kurangnya 3 huruf');
      return;
    }
    onLogin(trimmed);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="eyebrow">Evidence Pentaksiran</p>
        <h1>Log Masuk</h1>
        <p className="hero-copy">
          Masukkan nama anda untuk mula menggunakan app ini.
        </p>
        <p className="login-warning">
          ⚠️ Guna nama yang sama setiap kali log masuk. Data anda
          disimpan mengikut nama pengguna. Jika nama dilupakan, data tidak
          dapat diakses semula.
        </p>
        <input
          autoFocus
          className="form-input"
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Contoh: Cikgu Sarah"
          type="text"
          value={name}
        />
        {error && <p className="capture-error">{error}</p>}
        <button className="primary-action" onClick={handleSubmit} type="button">
          Mula
        </button>
      </div>
    </div>
  );
}
