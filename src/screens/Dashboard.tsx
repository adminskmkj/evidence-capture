import { classes, countStudentsByClassId, getClassesForSubject, subjects } from '../data/seed';

interface DashboardProps {
  evidenceThisMonth?: number;
  onStartEvidence: (subjectId: string, classId?: string) => void;
}

export function Dashboard({ evidenceThisMonth = 0, onStartEvidence }: DashboardProps) {
  return (
    <>
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Simpan evidence gambar dan video pendek dengan tersusun.</h2>
          <p className="hero-copy">
            Pilih shortcut subjek dan kelas untuk terus tambah evidence. Data ini
            menggunakan seed demo sementara sebelum sambungan Google Sheets siap.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={() => onStartEvidence('')}
          type="button"
        >
          + Tambah Evidence
        </button>
      </section>

      <section className="stat-grid" aria-label="Statistik dashboard">
        <article className="stat-card">
          <span>Subjek aktif</span>
          <strong>{subjects.length}</strong>
        </article>
        <article className="stat-card">
          <span>Kelas aktif</span>
          <strong>{classes.length}</strong>
        </article>
        <article className="stat-card">
          <span>Evidence bulan ini</span>
          <strong>{evidenceThisMonth}</strong>
        </article>
      </section>

      <section className="subject-grid" aria-label="Shortcut subjek dan kelas">
        {subjects.map((subject) => {
          const subjectClasses = getClassesForSubject(subject.subject_id);

          return (
            <article className="subject-card" key={subject.subject_id}>
              <div className="subject-card__header">
                <div>
                  <p className="subject-year">{subject.year_level}</p>
                  <h3>{subject.subject_name}</h3>
                </div>
                <span>{subjectClasses.length} kelas</span>
              </div>

              <ul>
                {subjectClasses.map((classGroup) => (
                  <li key={classGroup.class_id}>
                    <button
                      className="class-shortcut"
                      onClick={() => onStartEvidence(subject.subject_id, classGroup.class_id)}
                      type="button"
                    >
                      <span>{classGroup.class_name}</span>
                      <small>{countStudentsByClassId(classGroup.class_id)} murid demo</small>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </>
  );
}
