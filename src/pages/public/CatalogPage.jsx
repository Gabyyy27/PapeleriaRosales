import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from '../../lib/toasts'
import { ProductCard } from '../../modules/public/components/ProductCard'
import {
  CATALOG_PAGE_SIZE,
  getCatalogProducts,
  getPublicCategories,
} from '../../modules/public/services/catalog.service'

const SKELETON_ITEMS = Array.from({ length: 8 }, (_, index) => index)

function parsePage(value) {
  const parsedPage = Number.parseInt(value, 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

function getVisiblePages(currentPage, totalPages) {
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const lastPage = Math.min(totalPages, firstPage + 4)

  return Array.from(
    { length: Math.max(0, lastPage - firstPage + 1) },
    (_, index) => firstPage + index,
  )
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('buscar')?.trim() ?? ''
  const categoryId = searchParams.get('categoria') ?? ''
  const page = parsePage(searchParams.get('pagina'))
  const [searchDraft, setSearchDraft] = useState(search)
  const [categories, setCategories] = useState([])
  const [catalog, setCatalog] = useState({
    products: [],
    total: 0,
    loading: true,
    error: false,
  })
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()

    getPublicCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          toast.error(
            'No se cargaron las categorias',
            'El catalogo sigue disponible sin este filtro.',
          )
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    setCatalog((current) => ({
      ...current,
      products: [],
      loading: true,
      error: false,
    }))

    getCatalogProducts({
      page,
      search,
      categoryId,
      signal: controller.signal,
    })
      .then((result) => {
        const lastPage = Math.max(
          1,
          Math.ceil(result.total / CATALOG_PAGE_SIZE),
        )

        if (page > lastPage) {
          const nextParams = new URLSearchParams(searchParams)

          if (lastPage === 1) {
            nextParams.delete('pagina')
          } else {
            nextParams.set('pagina', String(lastPage))
          }

          setSearchParams(nextParams, { replace: true })
          return
        }

        setCatalog({
          products: result.products,
          total: result.total,
          loading: false,
          error: false,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return
        }

        setCatalog((current) => ({
          ...current,
          products: [],
          loading: false,
          error: true,
        }))
        toast.error(
          'No se pudo cargar el catalogo',
          'Intenta nuevamente en unos momentos.',
        )
      })

    return () => controller.abort()
  }, [
    categoryId,
    page,
    retryKey,
    search,
    searchParams,
    setSearchParams,
  ])

  const totalPages = Math.ceil(catalog.total / CATALOG_PAGE_SIZE)
  const visiblePages = getVisiblePages(page, totalPages)
  const hasFilters = Boolean(search || categoryId)

  function updateFilters(changes, { replace = false } = {}) {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(changes).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    setSearchParams(nextParams, { replace })
  }

  function handleSearch(event) {
    event.preventDefault()
    updateFilters({ buscar: searchDraft.trim(), pagina: '' })
  }

  function clearFilters() {
    setSearchDraft('')
    setSearchParams({})
  }

  function goToPage(nextPage) {
    updateFilters({ pagina: nextPage > 1 ? String(nextPage) : '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="catalog-page">
      <section className="catalog-intro">
        <div>
          <p className="eyebrow">Catalogo publico</p>
          <h1>Todo para estudiar, crear y trabajar</h1>
          <p>
            Explora productos disponibles y arma tu pedido para confirmarlo por
            WhatsApp.
          </p>
        </div>
        <div className="catalog-accent" aria-hidden="true">
          <span>Cuadernos</span>
          <span>Arte</span>
          <span>Oficina</span>
        </div>
      </section>

      <section className="catalog-content" aria-labelledby="catalog-results">
        <form className="catalog-filters" onSubmit={handleSearch}>
          <label className="search-field">
            <span>Buscar por nombre</span>
            <div>
              <Search aria-hidden="true" size={19} />
              <input
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Ej. cuaderno, marcador..."
                type="search"
                value={searchDraft}
              />
            </div>
          </label>

          {categories.length > 0 ? (
            <label className="category-field">
              <span>Categoria</span>
              <select
                onChange={(event) =>
                  updateFilters({
                    categoria: event.target.value,
                    pagina: '',
                  })
                }
                value={categoryId}
              >
                <option value="">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button className="primary-button filter-submit" type="submit">
            <Search aria-hidden="true" size={18} />
            Buscar
          </button>

          {hasFilters ? (
            <button
              className="clear-filter-button"
              onClick={clearFilters}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={17} />
              Limpiar
            </button>
          ) : null}
        </form>

        <div className="catalog-results-heading">
          <div>
            <h2 id="catalog-results">Productos</h2>
            {!catalog.loading && !catalog.error ? (
              <p>
                {catalog.total}{' '}
                {catalog.total === 1 ? 'resultado' : 'resultados'}
              </p>
            ) : null}
          </div>
          {search ? <span>Busqueda: "{search}"</span> : null}
        </div>

        {catalog.loading ? (
          <div className="product-grid" aria-label="Cargando productos">
            {SKELETON_ITEMS.map((item) => (
              <div className="product-card product-card-skeleton" key={item}>
                <div className="skeleton-media" />
                <div className="skeleton-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {catalog.error ? (
          <div className="catalog-state" role="alert">
            <PackageSearch aria-hidden="true" size={38} />
            <h2>No pudimos mostrar los productos</h2>
            <p>Revisa tu conexion e intenta cargar el catalogo nuevamente.</p>
            <button
              className="primary-button"
              onClick={() => setRetryKey((current) => current + 1)}
              type="button"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : null}

        {!catalog.loading &&
        !catalog.error &&
        catalog.products.length === 0 ? (
          <div className="catalog-state">
            <PackageSearch aria-hidden="true" size={38} />
            <h2>No encontramos productos</h2>
            <p>
              Prueba con otro nombre o elimina los filtros para ver el catalogo
              completo.
            </p>
            {hasFilters ? (
              <button
                className="secondary-link"
                onClick={clearFilters}
                type="button"
              >
                Ver todos los productos
              </button>
            ) : null}
          </div>
        ) : null}

        {!catalog.loading && !catalog.error && catalog.products.length > 0 ? (
          <div className="product-grid">
            {catalog.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        {!catalog.loading && !catalog.error && totalPages > 1 ? (
          <nav className="pagination" aria-label="Paginas del catalogo">
            <button
              aria-label="Pagina anterior"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                aria-current={pageNumber === page ? 'page' : undefined}
                className={pageNumber === page ? 'active' : ''}
                key={pageNumber}
                onClick={() => goToPage(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            ))}
            <button
              aria-label="Pagina siguiente"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  )
}
