import { useUserData } from '../context/UserDataContext';

interface DashboardProps {
  evidenceThisMonth?: number;
  onStartEvidence: (subjectId: string, classId?: string) => void;
  onOpenImport: () => void;
}

export function Dashboard({ evidenceThisMonth = 0, onStartEvidence, onOpenImport }: DashboardProps) {
  const { loading, error, classes, students, subjects, countStudentsByClassId } = useUserData();

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Simpan evidence gambar dan video pendek dengan tersusun.</h2>
          <p className="hero-copy">
            Kelas &amp; murid ikut akaun anda. Subjek anda setup sekali dalam <strong>Tetapan</strong> (jana dari Excel/kelas).
          </p>
        </div>

        <button className="primary-action" onClick={() => onStartEvidence('')} type="button">
          + Tambah Evidence
        </button>
      </section>

      <section className="stat-grid" aria-label="Statistik dashboard">
        <article className="stat-card">
          <span>Subjek anda</span>
          <strong>{loading ? '…' : subjects.length}</strong>
        </article>
        <article className="stat-card">
          <span>Kelas anda</span>
          <strong>{loading ? '…' : classes.length}</strong>
        </article>
        <article className="stat-card">
          <span>Murid anda</span>
          <strong>{loading ? '…' : students.length}</strong>
        </article>
        <article className="stat-card">
          <span>Evidence bulan ini</span>
          <strong>{evidenceThisMonth}</strong>
        </article>
      </section>

      {error && (
        <p className="capture-error" style={{ marginBottom: '1rem' }}>
          {error}{' '}
          {error.includes('kelas') && (
            <button className="text-button" onClick={onOpenImport} type="button">
              Muat naik Excel
            </button>
          )}
        </p>
      )}

      <section className="capture-panel" aria-label="Kelas dari senarai murid">
        <div className="form-header" style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Kelas anda</h3>
          <p className="context-note" style={{ margin: '0.35rem 0 0' }}>
            Setiap <strong>NAMA KELAS</strong> dalam Excel jadi satu kelas di sini.
          </p>
        </div>

        {loading && <p className="capture-loading">Memuatkan kelas…</p>}

        {!loading && classes.length === 0 && (
          <button className="primary-action" onClick={onOpenImport} type="button">
            Muat naik senarai murid (Excel)
          </button>
        )}

        {!loading && classes.length > 0 && (
          <ul className="class-shortcut-list">
            {classes.map((classGroup) => (
              <li key={classGroup.class_id}>
                <button
                  className="class-shortcut"
                  onClick={() => onStartEvidence('', classGroup.class_id)}
                  type="button"
                >
                  <span>{classGroup.class_name}</span>
                  <small>
                    {classGroup.year_level !== '—' ? `${classGroup.year_level} · ` : ''}
                    {countStudentsByClassId(classGroup.class_id)} murid
                  </small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="subject-grid" aria-label="Subjek anda">
        {!loading && subjects.length === 0 && (
          <p className="login-warning">
            Tiada subjek lagi. Pergi <strong>Tetapan → Setup subjek</strong> (jana dari kelas import).
          </p>
        )}
        {subjects.map((subject) => (
          <article className="subject-card" key={subject.subject_id}>
            <div className="subject-card__header">
              <div>
                <p className="subject-year">{subject.year_level}</p>
                <h3>{subject.subject_name}</h3>
              </div>
            </div>
            <button
              className="primary-action"
              onClick={() => onStartEvidence(subject.subject_id)}
              style={{ marginTop: '0.5rem', width: '100%' }}
              type="button"
            >
              Evidence {subject.subject_name}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}