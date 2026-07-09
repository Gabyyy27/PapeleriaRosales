const STATUS_LABELS = {
  active: 'Activo',
  inactive: 'Inactivo',
  archived: 'Archivado',
}

export function ProductStatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge-${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
