import { ChevronLeft, ChevronRight } from 'lucide-react'

function getVisiblePages(currentPage, totalPages) {
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const lastPage = Math.min(totalPages, firstPage + 4)

  return Array.from(
    { length: Math.max(0, lastPage - firstPage + 1) },
    (_, index) => firstPage + index,
  )
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  label = 'Paginacion',
}) {
  if (totalPages <= 1) {
    return null
  }

  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <nav className="pagination" aria-label={label}>
      <button
        aria-label="Pagina anterior"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          aria-current={pageNumber === currentPage ? 'page' : undefined}
          className={pageNumber === currentPage ? 'active' : ''}
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          type="button"
        >
          {pageNumber}
        </button>
      ))}

      <button
        aria-label="Pagina siguiente"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  )
}
