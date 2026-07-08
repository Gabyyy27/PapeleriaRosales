import { Eye, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '../../../lib/toasts'
import { getProductPath } from '../../../routes/paths'
import { useCart } from '../cart/useCart'
import { formatCurrency } from '../utils/currency'
import { ProductImage } from './ProductImage'

export function ProductCard({ product }) {
  const { addProduct } = useCart()
  const primaryImage = product.images[0]
  const isAvailable = product.stock > 0

  function handleAddToCart() {
    addProduct(product, 1)
    toast.success(
      'Producto agregado',
      `${product.name} se agrego al carrito.`,
    )
  }

  return (
    <article className="product-card">
      <Link
        aria-label={`Ver detalle de ${product.name}`}
        className="product-card-media"
        to={getProductPath(product.slug)}
      >
        <ProductImage
          alt={primaryImage?.alt || product.name}
          className="product-card-image"
          src={primaryImage?.url}
        />
        {product.categoryName ? (
          <span className="product-category">{product.categoryName}</span>
        ) : null}
      </Link>

      <div className="product-card-body">
        <div>
          <h2>
            <Link to={getProductPath(product.slug)}>{product.name}</Link>
          </h2>
          <p className="product-description">
            {product.description || 'Disponible para pedido por WhatsApp.'}
          </p>
        </div>

        <div className="product-card-price-row">
          <strong>{formatCurrency(product.salePrice)}</strong>
          <span className={isAvailable ? 'stock-available' : 'stock-unavailable'}>
            {isAvailable ? 'Disponible' : 'Agotado'}
          </span>
        </div>

        <div className="product-card-actions">
          <Link
            className="secondary-link product-detail-link"
            to={getProductPath(product.slug)}
          >
            <Eye aria-hidden="true" size={18} />
            Ver
          </Link>
          <button
            className="primary-button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            type="button"
          >
            <ShoppingCart aria-hidden="true" size={18} />
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}
