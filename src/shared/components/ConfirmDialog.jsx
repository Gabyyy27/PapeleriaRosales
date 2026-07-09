import { AlertTriangle, X } from 'lucide-react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null
  }

  return (
    <div className="dialog-layer" role="presentation">
      <button
        aria-label="Cerrar confirmacion"
        className="dialog-backdrop"
        disabled={loading}
        onClick={onCancel}
        type="button"
      />
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <div className="confirm-dialog-copy">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{description}</p>
        </div>
        <button
          aria-label="Cerrar"
          className="dialog-close-button"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
        <div className="confirm-dialog-actions">
          <button
            className="secondary-link"
            disabled={loading}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={danger ? 'danger-button' : 'primary-button'}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
