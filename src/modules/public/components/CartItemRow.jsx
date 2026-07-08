import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '../../../lib/toasts'
import { getProductPath } from '../../../routes/paths'
import { useCart } from '../cart/useCart'
import { formatCurrency } from '../utils/currency'
import { ProductImage } from './ProductImage'
import { QuantityControl } from './QuantityControl'

export function CartItemRow({ item, compact = false, onNavigate }) {
  const { removeProduct, setQuantity } = useCart()

  function handleRemove() {
    removeProduct(item.productId)
    toast.info('Producto eliminado', `${item.name} salio del carrito.`)
  }

  return (
    <article className={`cart-item ${compact ? 'cart-item-compact' : ''}`}>
      <Link
        aria-label={`Ver ${item.name}`}
        className="cart-item-media"
        onClick={onNavigate}
        to={getProductPath(item.slug)}
      >
        <ProductImage
          alt={item.imageAlt || item.name}
          className="cart-item-image"
          src={item.imageUrl}
        />
      </Link>

      <div className="cart-item-content">
        <div className="cart-item-heading">
          <div>
            <h2>
              <Link onClick={onNavigate} to={getProductPath(item.slug)}>
                {item.name}
              </Link>
            </h2>
            <p>{formatCurrency(item.salePrice)} c/u</p>
          </div>
          <button
            aria-label={`Quitar ${item.name}`}
            className="remove-item-button"
            onClick={handleRemove}
            title="Quitar producto"
            type="button"
          >
            <Trash2 aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="cart-item-footer">
          <QuantityControl
            label={`Cantidad de ${item.name}`}
            onChange={(quantity) => setQuantity(item.productId, quantity)}
            value={item.quantity}
          />
          <strong>{formatCurrency(item.salePrice * item.quantity)}</strong>
        </div>
      </div>
    </article>
  )
}
