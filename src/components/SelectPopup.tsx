import { useEffect, useRef, type ReactNode } from 'react';

interface SelectPopupProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SelectPopup({ open, title, onClose, children }: SelectPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="select-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      ref={overlayRef}
      role="dialog"
    >
      <div className="select-popup">
        <div className="select-popup__head">
          <strong>{title}</strong>
          <button className="select-popup__close" onClick={onClose} type="button">✕</button>
        </div>
        <div className="select-popup__body">{children}</div>
      </div>
    </div>
  );
}
