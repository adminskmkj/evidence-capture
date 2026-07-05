import { useState } from 'react';
import { EvidenceForm, type EvidenceFormData } from '../components/EvidenceForm';

interface AddEvidenceProps {
  initialSubjectId?: string;
  initialClassId?: string;
}

export function AddEvidence({ initialSubjectId, initialClassId }: AddEvidenceProps) {
  const [formData, setFormData] = useState<EvidenceFormData | null>(null);

  function handleFormSubmit(data: EvidenceFormData) {
    setFormData(data);
  }

  if (formData) {
    return (
      <section className="placeholder-panel">
        <p className="eyebrow">Evidence Form Selesai</p>
        <h2>Seterusnya: Ambil Gambar / Rakam Video</h2>
        <p>
          Subjek: {formData.subjectId} | Kelas: {formData.classId} | Murid:{' '}
          {formData.studentIds.length} dipilih | Aktiviti: {formData.activityTitle}
        </p>
        <button
          className="primary-action"
          onClick={() => setFormData(null)}
          type="button"
        >
          Kembali ke Form
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="form-header">
        <p className="eyebrow">Tambah Evidence</p>
        <h2>Pilih subjek, kelas dan murid</h2>
      </div>
      <EvidenceForm
        initialClassId={initialClassId}
        initialSubjectId={initialSubjectId}
        onSubmit={handleFormSubmit}
      />
    </section>
  );
}
