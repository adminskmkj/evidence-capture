import { useState } from 'react';
import { EvidenceForm, type EvidenceFormData } from '../components/EvidenceForm';
import { ImageCapture, type CapturedImage } from '../components/ImageCapture';

type Step = 'form' | 'capture' | 'done';

interface AddEvidenceProps {
  initialSubjectId?: string;
  initialClassId?: string;
}

export function AddEvidence({ initialSubjectId, initialClassId }: AddEvidenceProps) {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<EvidenceFormData | null>(null);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);

  function handleFormSubmit(data: EvidenceFormData) {
    setFormData(data);
    setStep('capture');
  }

  function handleImageCapture(image: CapturedImage) {
    setCapturedImage(image);
    setStep('done');
  }

  function handleReset() {
    setStep('form');
    setFormData(null);
    setCapturedImage(null);
  }

  if (step === 'done' && capturedImage) {
    return (
      <section className="placeholder-panel">
        <p className="eyebrow">Evidence Disimpan</p>
        <h2>Gambar berjaya diambil</h2>
        <img alt="Evidence" className="capture-preview" src={capturedImage.dataUrl} />
        <p>Saiz: {(capturedImage.sizeBytes / 1024).toFixed(0)} KB</p>
        <p>Subjek: {formData?.subjectId} | Aktiviti: {formData?.activityTitle}</p>
        <p className="context-note">Upload ke Google Drive akan datang dalam Task 12.</p>
        <button className="primary-action" onClick={handleReset} type="button">
          Tambah Evidence Baru
        </button>
      </section>
    );
  }

  if (step === 'capture') {
    return (
      <section>
        <div className="form-header">
          <p className="eyebrow">Ambil Gambar</p>
          <h2>Snap gambar evidence</h2>
        </div>
        <ImageCapture
          onCapture={handleImageCapture}
          onRetake={() => setCapturedImage(null)}
        />
        <div className="form-actions">
          <button className="form-chip" onClick={handleReset} type="button">
            ← Kembali ke Form
          </button>
        </div>
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
