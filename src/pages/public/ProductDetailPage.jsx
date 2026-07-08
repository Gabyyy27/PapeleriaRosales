import { useEffect, useState } from 'react'
import { ArrowLeft, PackageX, ShoppingCart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from '../../lib/toasts'
import { useCart } from '../../modules/public/cart/useCart'
import { ProductGallery } from '../../modules/public/components/ProductGallery'
import { QuantityControl } from '../../modules/public/components/QuantityControl'
import { getCatalogProductBySlug } from '../../modules/public/services/catalog.service'
import { formatCurrency } from '../../modules/public/utils/currency'
import { publicPaths } from '../../routes/paths'

export function ProductDetailPage() {
  const { productSlug } = useParams()
  const { addProduct } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({
    product: null,
    loading: true,
    error: false,
  })

  useEffect(() => {
    const controller = new AbortController()

    setQuantity(1)
    setState({ product: null, loading: true, error: false })

    getCatalogProductBySlug(productSlug, { signal: controller.signal })
      .then((product) => {
        setState({ product, loading: false, error: false })
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return
        }

        setState({ product: null, loading: false, error: true })
        toast.error(
          'No se pudo cargar el producto',
          'Intenta nuevamente en unos momentos.',
        )
      })

    return () => controller.abort()
  }, [productSlug, reloadKey])

  if (state.loading) {
    return (
      <main className="product-detail-page" aria-label="Cargando producto">
        <div className="detail-skeleton">
          <div className="detail-skeleton-media" />
          <div className="skeleton-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    )
  }

  if (state.error) {
    return (
      <main className="product-detail-page">
        <div className="catalog-state" role="alert">
          <PackageX aria-hidden="true" size={40} />
          <h1>No pudimos cargar este producto</h1>
          <p>Revisa tu conexion e intenta nuevamente.</p>
          <button
            className="primary-button"
            onClick={() => setReloadKey((current) => current + 1)}
            type="button"
          >
            Intentar de nuevo
          </button>
        </div>
      </main>
    )
  }

  if (!state.product) {
    return (
      <main className="product-detail-page">
        <div className="catalog-state">
          <PackageX aria-hidden="true" size={40} />
          <h1>Producto no encontrado</h1>
          <p>Puede que ya no este disponible en el catalogo publico.</p>
          <Link className="primary-link" to={publicPaths.catalog}>
            Volver al catalogo
          </Link>
        </div>
      </main>
    )
  }

  const product = state.product
  const isAvailable = product.stock > 0
  const maxQuantity = Math.min(99, Math.max(1, product.stock))

  function handleAddToCart() {
    addProduct(product, quantity)
    toast.success(
      'Producto agregado',
      `${quantity} x ${product.name} se agrego al carrito.`,
    )
  }

  return (
    <main className="product-detail-page">
      <Link className="back-link" to={publicPaths.catalog}>
        <ArrowLeft aria-hidden="true" size={18} />
        Volver al catalogo
      </Link>

      <div className="product-detail-layout">
        <ProductGallery images={product.images} productName={product.name} />

        <section className="product-detail-content">
          {product.categoryName ? (
            <p className="eyebrow">{product.categoryName}</p>
          ) : null}
          <h1>{product.name}</h1>
          <p className="detail-price">{formatCurrency(product.salePrice)}</p>
          <span
            className={isAvailable ? 'stock-available' : 'stock-unavailable'}
          >
            {isAvailable ? 'Disponible para pedido' : 'Agotado'}
          </span>
          <p className="detail-description">
            {product.description ||
              'Consulta este producto y confirma disponibilidad por WhatsApp.'}
          </p>
          {product.sku ? (
            <p className="product-sku">
              Codigo: <span>{product.sku}</span>
            </p>
          ) : null}

          <div className="detail-order-controls">
            <QuantityControl
              max={maxQuantity}
              onChange={setQuantity}
              value={quantity}
            />
            <button
              className="primary-button"
              disabled={!isAvailable}
              onClick={handleAddToCart}
              type="button"
            >
              <ShoppingCart aria-hidden="true" size={19} />
              Agregar al carrito
            </button>
          </div>
          <p className="detail-note">
            El pedido se confirma directamente con Papeleria Rosales por
            WhatsApp.
          </p>
        </section>
      </div>
    </main>
  )
}
