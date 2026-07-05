import { useState } from 'react';
import { EvidenceForm, type EvidenceFormData } from '../components/EvidenceForm';
import { ImageCapture, type CapturedImage } from '../components/ImageCapture';
import { VideoRecorder, type CapturedVideo } from '../components/VideoRecorder';
import { MediaPreview } from '../components/MediaPreview';
import { uploadEvidence } from '../api/appsScriptClient';

type Step = 'form' | 'capture-image' | 'capture-video' | 'preview' | 'uploading' | 'done';

interface AddEvidenceProps {
  initialSubjectId?: string;
  initialClassId?: string;
}

export function AddEvidence({ initialSubjectId, initialClassId }: AddEvidenceProps) {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<EvidenceFormData | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<
    { type: 'image'; data: CapturedImage } | { type: 'video'; data: CapturedVideo } | null
  >(null);
  const [result, setResult] = useState<{ ok: boolean; evidence_id?: string; error?: string } | null>(
    null,
  );

  function handleFormSubmit(data: EvidenceFormData) {
    setFormData(data);
  }

  function handleImageCapture(image: CapturedImage) {
    setCapturedMedia({ type: 'image', data: image });
    setStep('preview');
  }

  function handleVideoCapture(video: CapturedVideo) {
    setCapturedMedia({ type: 'video', data: video });
    setStep('preview');
  }

  async function handleSave() {
    if (!formData || !capturedMedia) return;
    setStep('uploading');
    const res = await uploadEvidence(formData, capturedMedia);
    setResult(res);
    setStep('done');
  }

  function handleReset() {
    setStep('form');
    setFormData(null);
    setCapturedMedia(null);
    setResult(null);
  }

  if (step === 'done') {
    return (
      <section className="placeholder-panel">
        <p className="eyebrow">Evidence Disimpan</p>
        {result?.ok ? (
          <>
            <h2>✅ Evidence berjaya dihantar</h2>
            <p>ID: {result.evidence_id}</p>
            <p>Subjek: {formData?.subjectId} | Aktiviti: {formData?.activityTitle}</p>
          </>
        ) : (
          <>
            <h2>❌ Upload gagal</h2>
            <p>{result?.error || 'Ralat tidak diketahui'}</p>
          </>
        )}
        <button className="primary-action" onClick={handleReset} type="button">
          Tambah Evidence Baru
        </button>
      </section>
    );
  }

  if (step === 'uploading') {
    return (
      <section className="placeholder-panel">
        <p className="eyebrow">Memuat Naik</p>
        <h2>Sedang menghantar evidence...</h2>
        <p>Sila tunggu sebentar.</p>
      </section>
    );
  }

  if (step === 'preview' && capturedMedia) {
    return (
      <section>
        <MediaPreview
          media={capturedMedia}
          onDiscard={handleReset}
          onRetake={() => {
            setCapturedMedia(null);
            setStep(capturedMedia.type === 'image' ? 'capture-image' : 'capture-video');
          }}
          onSave={handleSave}
        />
      </section>
    );
  }

  if (step === 'capture-image') {
    return (
      <section>
        <div className="form-header">
          <p className="eyebrow">Ambil Gambar</p>
          <h2>Snap gambar evidence</h2>
        </div>
        <ImageCapture onCapture={handleImageCapture} onRetake={() => setCapturedMedia(null)} />
        <div className="form-actions">
          <button className="form-chip" onClick={() => setStep('form')} type="button">
            ← Kembali ke Form
          </button>
        </div>
      </section>
    );
  }

  if (step === 'capture-video') {
    return (
      <section>
        <div className="form-header">
          <p className="eyebrow">Rakam Video</p>
          <h2>Rakam video evidence (maks 90 saat)</h2>
        </div>
        <VideoRecorder onCapture={handleVideoCapture} onRetake={() => setCapturedMedia(null)} />
        <div className="form-actions">
          <button className="form-chip" onClick={() => setStep('form')} type="button">
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
      {formData && (
        <div className="form-actions" style={{ marginTop: '1.25rem' }}>
          <button
            className="primary-action"
            onClick={() => setStep('capture-image')}
            type="button"
          >
            📷 Ambil Gambar
          </button>
          <button
            className="primary-action"
            onClick={() => setStep('capture-video')}
            type="button"
          >
            🎥 Rakam Video
          </button>
        </div>
      )}
    </section>
  );
}
