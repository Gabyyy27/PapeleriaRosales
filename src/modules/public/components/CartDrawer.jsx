import { useEffect } from 'react'
import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { publicPaths } from '../../../routes/paths'
import { useCart } from '../cart/useCart'
import { formatCurrency } from '../utils/currency'
import { CartItemRow } from './CartItemRow'
import { WhatsAppCartButton } from './WhatsAppCartButton'

export function CartDrawer({ isOpen, onClose }) {
  const { items, itemCount, subtotal } = useCart()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="cart-drawer-layer">
      <button
        aria-label="Cerrar carrito"
        className="cart-backdrop"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Carrito de compras"
        aria-modal="true"
        className="cart-drawer"
        role="dialog"
      >
        <header className="cart-drawer-header">
          <div>
            <span className="cart-drawer-icon">
              <ShoppingBag aria-hidden="true" size={20} />
            </span>
            <div>
              <h2>Tu pedido</h2>
              <p>
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar carrito"
            className="drawer-close-button"
            onClick={onClose}
            title="Cerrar"
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-drawer-empty">
            <ShoppingBag aria-hidden="true" size={36} />
            <h3>Tu carrito esta vacio</h3>
            <p>Agrega productos del catalogo para preparar tu pedido.</p>
            <Link
              className="primary-link"
              onClick={onClose}
              to={publicPaths.catalog}
            >
              Ver catalogo
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {items.map((item) => (
                <CartItemRow
                  compact
                  item={item}
                  key={item.productId}
                  onNavigate={onClose}
                />
              ))}
            </div>
            <footer className="cart-drawer-footer">
              <div className="cart-subtotal">
                <span>Total estimado</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <WhatsAppCartButton />
              <Link
                className="drawer-cart-link"
                onClick={onClose}
                to={publicPaths.cart}
              >
                Ver carrito completo
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
