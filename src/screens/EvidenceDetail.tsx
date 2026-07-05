import type { EvidenceItem } from '../types/domain';

interface EvidenceDetailProps {
  item: EvidenceItem;
  onBack: () => void;
}

export function EvidenceDetail({ item, onBack }: EvidenceDetailProps) {
  const sizeLabel =
    item.evidence_type === 'image'
      ? `${(item.file_size_bytes / 1024).toFixed(0)} KB`
      : `${(item.file_size_bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <section>
      <button className="form-chip" onClick={onBack} type="button">
        ← Kembali ke Galeri
      </button>

      <div className="form-header">
        <p className="eyebrow">{item.evidence_type === 'image' ? 'Gambar' : 'Video'}</p>
        <h2>{item.activity_title}</h2>
      </div>

      <div className="capture-panel">
        {item.evidence_type === 'image' ? (
          <img alt={item.activity_title} className="capture-preview" src={item.file_url} />
        ) : (
          <video className="capture-preview" controls preload="metadata" src={item.file_url} />
        )}

        <div className="capture-info">
          <span>{item.evidence_type === 'image' ? '📷' : '🎥'}</span>
          <strong>{sizeLabel}</strong>
          {item.duration_seconds ? (
            <>
              <span>·</span>
              <strong>{item.duration_seconds}s</strong>
            </>
          ) : null}
        </div>

        <dl className="evidence-meta">
          <dt>Subjek</dt>
          <dd>{item.subject_id}</dd>

          <dt>Kelas</dt>
          <dd>{item.class_id}</dd>

          <dt>Murid</dt>
          <dd>{item.student_ids?.length || 0} orang</dd>

          <dt>Tarikh</dt>
          <dd>{new Date(item.created_at).toLocaleString('ms')}</dd>

          {item.notes && (
            <>
              <dt>Catatan</dt>
              <dd>{item.notes}</dd>
            </>
          )}

          {item.file_url && (
            <>
              <dt>Google Drive</dt>
              <dd>
                <a href={item.file_url} rel="noreferrer" target="_blank">
                  Buka di Drive
                </a>
              </dd>
            </>
          )}
        </dl>
      </div>
    </section>
  );
}
