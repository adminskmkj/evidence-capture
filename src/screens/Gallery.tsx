import { useEffect, useRef, useState } from 'react';
import { listEvidence, type ListEvidenceFilters } from '../api/appsScriptClient';
import { getClassesForSubject, subjects } from '../data/seed';
import type { EvidenceItem } from '../types/domain';

interface GalleryProps {
  onViewEvidence?: (item: EvidenceItem) => void;
}

export function Gallery({ onViewEvidence }: GalleryProps) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ListEvidenceFilters>({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const filtersRef = useRef(filters);

  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    filtersRef.current = filters;

    listEvidence(filters, pageSize, 0)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setOffset(res.nextOffset);
        setHasMore(res.nextOffset > 0);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    setLoading(true);
    const res = await listEvidence(filtersRef.current, pageSize, offset);
    setItems((prev) => [...prev, ...res.items]);
    setOffset(res.nextOffset);
    setHasMore(res.nextOffset > 0);
    setLoading(false);
  }

  const classOptions = filters.subject_id ? getClassesForSubject(filters.subject_id) : [];

  return (
    <section>
      <div className="form-header">
        <p className="eyebrow">Galeri</p>
        <h2>Evidence tersimpan</h2>
      </div>

      <div className="form-chips" style={{ marginBottom: '1rem' }}>
        <select
          className="form-chip"
          onChange={(e) =>
            setFilters((f) => ({ ...f, subject_id: e.target.value || undefined, class_id: undefined }))
          }
          value={filters.subject_id || ''}
        >
          <option value="">Semua Subjek</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
          ))}
        </select>

        {classOptions.length > 0 && (
          <select
            className="form-chip"
            onChange={(e) =>
              setFilters((f) => ({ ...f, class_id: e.target.value || undefined }))
            }
            value={filters.class_id || ''}
          >
            <option value="">Semua Kelas</option>
            {classOptions.map((c) => (
              <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
            ))}
          </select>
        )}

        <select
          className="form-chip"
          onChange={(e) =>
            setFilters((f) => ({ ...f, type: (e.target.value as ListEvidenceFilters['type']) || undefined }))
          }
          value={filters.type || ''}
        >
          <option value="">Semua Jenis</option>
          <option value="image">Gambar</option>
          <option value="video">Video</option>
        </select>
      </div>

      {loading && items.length === 0 && <p className="capture-loading">Memuat evidence...</p>}

      {!loading && items.length === 0 && (
        <p className="context-note">Tiada evidence dijumpai. Tambah evidence baru.</p>
      )}

      <div className="gallery-grid">
        {items.map((item) => (
          <article
            className="evidence-card"
            key={item.evidence_id}
            onClick={() => onViewEvidence?.(item)}
            onKeyDown={(e) => { if (e.key === 'Enter') onViewEvidence?.(item); }}
            tabIndex={0}
            role="button"
          >
            {item.evidence_type === 'image' ? (
              <img alt={item.activity_title} className="evidence-thumb" src={item.file_url} />
            ) : (
              <div className="evidence-thumb evidence-thumb--video">
                <span>▶</span>
              </div>
            )}
            <div className="evidence-card__body">
              <strong>{item.activity_title}</strong>
              <small>{item.subject_id} · {item.class_id}</small>
              <small>{new Date(item.created_at).toLocaleDateString('ms')}</small>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="form-actions">
          <button className="primary-action" disabled={loading} onClick={handleLoadMore} type="button">
            Muat Lagi
          </button>
        </div>
      )}
    </section>
  );
}
