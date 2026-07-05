import { classes, countStudentsByClassId, getClassesForSubject, subjects } from './data/seed';

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Evidence Pentaksiran</p>
        <h1>Simpan evidence gambar dan video pendek dengan tersusun.</h1>
        <p className="hero-copy">
          MVP ini akan menyokong gambar bawah 500KB, video maksimum 90 saat,
          Google Drive untuk media, dan Google Sheets untuk metadata.
        </p>

        <div className="seed-summary" aria-label="Ringkasan data demo">
          <div>
            <strong>{subjects.length}</strong>
            <span>subjek</span>
          </div>
          <div>
            <strong>{classes.length}</strong>
            <span>kelas</span>
          </div>
        </div>
      </section>

      <section className="subject-grid" aria-label="Senarai subjek dan kelas demo">
        {subjects.map((subject) => (
          <article className="subject-card" key={subject.subject_id}>
            <p className="subject-year">{subject.year_level}</p>
            <h2>{subject.subject_name}</h2>
            <ul>
              {getClassesForSubject(subject.subject_id).map((classGroup) => (
                <li key={classGroup.class_id}>
                  <span>{classGroup.class_name}</span>
                  <small>{countStudentsByClassId(classGroup.class_id)} murid demo</small>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
