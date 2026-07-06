import { useUserData } from '../context/UserDataContext';
import { formatTeachingSlotMeta } from '../data/subjectSetup';

interface DashboardProps {
  evidenceThisMonth?: number;
  onStartEvidence: (subjectId: string, classId?: string) => void;
  onOpenImport: () => void;
}

export function Dashboard({ evidenceThisMonth = 0, onStartEvidence, onOpenImport }: DashboardProps) {
  const { loading, error, allClasses, classes, students, teachingSlots, countStudentsByClassId } = useUserData();

  const studentCountInTeaching = students.filter((s) => classes.some((c) => c.class_id === s.class_id)).length;

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Evidence untuk kelas yang anda ajar sahaja.</h2>
          <p className="hero-copy">
            Excel boleh ada banyak kelas — pilih <strong>5 kelas (atau berapa pun)</strong> dalam{' '}
            <strong>Tetapan → Setup kelas &amp; subjek</strong>.
          </p>
        </div>

        <button className="primary-action" onClick={() => onStartEvidence('')} type="button">
          + Tambah Evidence
        </button>
      </section>

      <section className="stat-grid" aria-label="Statistik dashboard">
        <article className="stat-card">
          <span>Kelas anda ajar</span>
          <strong>{loading ? '…' : classes.length}</strong>
        </article>
        <article className="stat-card">
          <span>Subjek (baris setup)</span>
          <strong>{loading ? '…' : teachingSlots.length}</strong>
        </article>
        <article className="stat-card">
          <span>Murid (kelas anda)</span>
          <strong>{loading ? '…' : studentCountInTeaching}</strong>
        </article>
        <article className="stat-card">
          <span>Evidence bulan ini</span>
          <strong>{evidenceThisMonth}</strong>
        </article>
      </section>

      {error && (
        <p className="capture-error" style={{ marginBottom: '1rem' }}>
          {error}{' '}
          {error.includes('Sheet') && (
            <button className="text-button" onClick={onOpenImport} type="button">
              Muat naik Excel
            </button>
          )}
        </p>
      )}

      {!loading && allClasses.length > 0 && classes.length === 0 && (
        <p className="login-warning" style={{ marginBottom: '1rem' }}>
          Ada {allClasses.length} kelas dalam Sheet tetapi anda belum setup kelas ajar. Pergi <strong>Tetapan</strong>.
        </p>
      )}

      <section className="subject-grid" aria-label="Kelas dan subjek anda">
        {!loading && teachingSlots.length === 0 && allClasses.length > 0 && (
          <p className="login-warning">Tiada setup. Tetapan → pilih kelas + subjek.</p>
        )}

        {teachingSlots.map((slot) => (
          <article className="subject-card" key={slot.slot_id}>
            <div className="subject-card__header">
              <div>
                <p className="subject-year">{slot.class_name}</p>
                <h3>{slot.subject_name}</h3>
              </div>
            </div>
            <p className="context-note" style={{ margin: '0 0 0.5rem' }}>
              {formatTeachingSlotMeta(slot, countStudentsByClassId(slot.class_id))}
            </p>
            <button
              className="primary-action"
              onClick={() => onStartEvidence(slot.subject_id, slot.class_id)}
              style={{ width: '100%' }}
              type="button"
            >
              + Evidence
            </button>
          </article>
        ))}
      </section>
    </>
  );
}