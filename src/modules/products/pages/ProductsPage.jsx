import { useCallback, useEffect, useState } from 'react'
import { Archive, PackageSearch, Plus, RotateCcw, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'
import { toast } from '../../../lib/toasts'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Pagination } from '../../../shared/components/Pagination'
import { useAdminOrganization } from '../../../shared/hooks/useAdminOrganization'
import { adminPaths } from '../../../routes/paths'
import { getProductCategories } from '../services/categories.service'
import {
  archiveProduct,
  ADMIN_PRODUCTS_PAGE_SIZE,
  deleteProduct,
  getAdminProducts,
  isProductDeleteBlocked,
} from '../services/products.service'
import {
  getProductImages,
  removeProductImageFiles,
} from '../services/productImages.service'
import { ProductTable } from '../components/ProductTable'

function parsePage(value) {
  const parsedPage = Number.parseInt(value, 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export function ProductsPage() {
  const { user } = useAuth()
  const { loading: loadingOrg, organization, error: orgError } =
    useAdminOrganization()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('buscar')?.trim() ?? ''
  const status = searchParams.get('estado') ?? ''
  const categoryId = searchParams.get('categoria') ?? ''
  const page = parsePage(searchParams.get('pagina'))
  const [searchDraft, setSearchDraft] = useState(search)
  const [categories, setCategories] = useState([])
  const [listState, setListState] = useState({
    products: [],
    total: 0,
    loading: true,
    error: null,
  })
  const [confirmState, setConfirmState] = useState(null)
  const [processingAction, setProcessingAction] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    if (!organization?.id || !organization.canManageProducts) {
      return
    }

    const controller = new AbortController()

    getProductCategories({
      orgId: organization.id,
      includeInactive: true,
      signal: controller.signal,
    })
      .then(setCategories)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          toast.error(
            'No se cargaron las categorias',
            'El filtro por categoria no esta disponible.',
          )
        }
      })

    return () => controller.abort()
  }, [organization])

  const updateFilters = useCallback((changes, replace = false) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(changes).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    setSearchParams(nextParams, { replace })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!organization?.id || !organization.canManageProducts) {
      return
    }

    const controller = new AbortController()

    setListState((current) => ({
      ...current,
      products: [],
      loading: true,
      error: null,
    }))

    getAdminProducts({
      orgId: organization.id,
      page,
      search,
      status,
      categoryId,
      signal: controller.signal,
    })
      .then((result) => {
        const lastPage = Math.max(
          1,
          Math.ceil(result.total / ADMIN_PRODUCTS_PAGE_SIZE),
        )

        if (page > lastPage) {
          updateFilters({ pagina: lastPage > 1 ? String(lastPage) : '' }, true)
          return
        }

        setListState({
          products: result.products,
          total: result.total,
          loading: false,
          error: null,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return
        }

        setListState({
          products: [],
          total: 0,
          loading: false,
          error,
        })
        toast.error(
          'No se pudieron cargar los productos',
          'Revisa permisos o conexion e intenta de nuevo.',
        )
      })

    return () => controller.abort()
  }, [
    categoryId,
    organization,
    page,
    retryKey,
    search,
    status,
    updateFilters,
  ])

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

  async function handleConfirmAction() {
    if (!confirmState?.product || !organization?.id) {
      return
    }

    setProcessingAction(true)

    try {
      if (confirmState.type === 'archive') {
        await archiveProduct({
          orgId: organization.id,
          productId: confirmState.product.id,
          userId: user?.id,
        })
        toast.success('Producto archivado', confirmState.product.name)
      } else {
        const images = await getProductImages({
          orgId: organization.id,
          productId: confirmState.product.id,
        })

        try {
          await deleteProduct({
            orgId: organization.id,
            productId: confirmState.product.id,
          })
        } catch (error) {
          if (!isProductDeleteBlocked(error)) {
            throw error
          }

          await archiveProduct({
            orgId: organization.id,
            productId: confirmState.product.id,
            userId: user?.id,
          })
          toast.warning(
            'Producto archivado',
            'No se puede eliminar porque tiene ventas registradas. Se archivo para conservar el historial.',
          )
          setConfirmState(null)
          setRetryKey((current) => current + 1)
          return
        }

        try {
          await removeProductImageFiles(images)
        } catch (cleanupError) {
          toast.warning(
            'Producto eliminado',
            'Algunos archivos de imagen no se pudieron limpiar del bucket.',
          )
          console.error(cleanupError)
          setConfirmState(null)
          setRetryKey((current) => current + 1)
          return
        }

        toast.success('Producto eliminado', confirmState.product.name)
      }

      setConfirmState(null)
      setRetryKey((current) => current + 1)
    } catch (error) {
      toast.error(
        confirmState.type === 'archive'
          ? 'No se pudo archivar'
          : 'No se pudo eliminar',
        error.cause?.message ?? error.message,
      )
    } finally {
      setProcessingAction(false)
    }
  }

  const totalPages = Math.ceil(listState.total / ADMIN_PRODUCTS_PAGE_SIZE)
  const hasFilters = Boolean(search || status || categoryId)

  if (loadingOrg) {
    return (
      <main className="admin-content">
        <div className="admin-loading-state">Validando organizacion...</div>
      </main>
    )
  }

  if (orgError || !organization) {
    return (
      <main className="admin-content">
        <EmptyState
          title="No hay organizacion disponible"
          description="Tu usuario debe pertenecer a Papeleria Rosales para administrar productos."
          tone="warning"
        />
      </main>
    )
  }

  if (!organization.canManageProducts) {
    return (
      <main className="admin-content">
        <EmptyState
          title="Permisos insuficientes"
          description="Solo usuarios owner o admin pueden crear, editar o eliminar productos."
          tone="warning"
        />
      </main>
    )
  }

  return (
    <main className="admin-content products-admin-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Productos</p>
          <h1>Inventario comercial</h1>
          <p>Gestiona catalogo publico, precios, costos internos e imagenes.</p>
        </div>
        <Link className="primary-button" to={adminPaths.newProduct}>
          <Plus aria-hidden="true" size={18} />
          Nuevo producto
        </Link>
      </section>

      <form className="admin-filters" onSubmit={handleSearch}>
        <label className="search-field">
          <span>Buscar</span>
          <div>
            <Search aria-hidden="true" size={19} />
            <input
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Nombre, SKU o codigo de barras"
              type="search"
              value={searchDraft}
            />
          </div>
        </label>

        <label className="category-field">
          <span>Estado</span>
          <select
            onChange={(event) =>
              updateFilters({ estado: event.target.value, pagina: '' })
            }
            value={status}
          >
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="archived">Archivado</option>
          </select>
        </label>

        <label className="category-field">
          <span>Categoria</span>
          <select
            onChange={(event) =>
              updateFilters({ categoria: event.target.value, pagina: '' })
            }
            value={categoryId}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

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

      <div className="admin-results-heading">
        <h2>Productos registrados</h2>
        {!listState.loading && !listState.error ? (
          <span>
            {listState.total}{' '}
            {listState.total === 1 ? 'resultado' : 'resultados'}
          </span>
        ) : null}
      </div>

      {listState.error ? (
        <EmptyState
          action={
            <button
              className="primary-button"
              onClick={() => setRetryKey((current) => current + 1)}
              type="button"
            >
              Intentar de nuevo
            </button>
          }
          icon={PackageSearch}
          title="No se pudo cargar el listado"
          description="La consulta administrativa fallo o el usuario no tiene permisos suficientes."
          tone="warning"
        />
      ) : null}

      {!listState.loading &&
      !listState.error &&
      listState.products.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <button
                className="secondary-link"
                onClick={clearFilters}
                type="button"
              >
                Ver todos
              </button>
            ) : (
              <Link className="primary-button" to={adminPaths.newProduct}>
                <Plus aria-hidden="true" size={18} />
                Nuevo producto
              </Link>
            )
          }
          icon={Archive}
          title="No hay productos para mostrar"
          description="Crea un producto o ajusta los filtros activos."
        />
      ) : (
        <ProductTable
          getEditPath={adminPaths.productEdit}
          loading={listState.loading}
          onArchive={(product) => setConfirmState({ type: 'archive', product })}
          onDelete={(product) => setConfirmState({ type: 'delete', product })}
          products={listState.products}
        />
      )}

      {!listState.loading && !listState.error ? (
        <Pagination
          currentPage={page}
          label="Paginas de productos"
          onPageChange={goToPage}
          totalPages={totalPages}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel={
          confirmState?.type === 'archive' ? 'Archivar' : 'Eliminar'
        }
        danger={confirmState?.type === 'delete'}
        description={
          confirmState?.type === 'archive'
            ? 'El producto saldra del catalogo activo, pero podras editarlo y reactivarlo despues.'
            : 'Si no tiene ventas, se eliminara con su costo y metadata de imagenes. Si ya tiene ventas, se archivara para conservar el historial.'
        }
        loading={processingAction}
        onCancel={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        open={Boolean(confirmState)}
        title={
          confirmState?.product
            ? `${confirmState.type === 'archive' ? 'Archivar' : 'Eliminar'} ${confirmState.product.name}`
            : ''
        }
      />
    </main>
  )
}
