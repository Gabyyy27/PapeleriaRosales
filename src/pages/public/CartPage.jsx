import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '../../lib/toasts'
import { useCart } from '../../modules/public/cart/useCart'
import { CartItemRow } from '../../modules/public/components/CartItemRow'
import { WhatsAppCartButton } from '../../modules/public/components/WhatsAppCartButton'
import { formatCurrency } from '../../modules/public/utils/currency'
import { publicPaths } from '../../routes/paths'

export function CartPage() {
  const { items, itemCount, subtotal, clearCart } = useCart()

  function handleClearCart() {
    clearCart()
    toast.info('Carrito vaciado', 'Se quitaron todos los productos.')
  }

  return (
    <main className="cart-page">
      <Link className="back-link" to={publicPaths.catalog}>
        <ArrowLeft aria-hidden="true" size={18} />
        Seguir comprando
      </Link>

      <header className="cart-page-header">
        <div>
          <p className="eyebrow">Tu seleccion</p>
          <h1>Carrito de pedido</h1>
          <p>
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu
            carrito
          </p>
        </div>
        {items.length > 0 ? (
          <button
            className="clear-cart-button"
            onClick={handleClearCart}
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} />
            Vaciar carrito
          </button>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="catalog-state cart-empty-state">
          <ShoppingBag aria-hidden="true" size={42} />
          <h2>Aun no has agregado productos</h2>
          <p>Explora el catalogo y agrega lo que necesitas para tu pedido.</p>
          <Link className="primary-link" to={publicPaths.catalog}>
            Explorar catalogo
          </Link>
        </div>
      ) : (
        <div className="cart-page-layout">
          <section className="cart-page-items" aria-label="Productos del carrito">
            {items.map((item) => (
              <CartItemRow item={item} key={item.productId} />
            ))}
          </section>

          <aside className="order-summary">
            <p className="eyebrow">Resumen</p>
            <h2>Tu pedido</h2>
            <div className="summary-row">
              <span>Productos</span>
              <span>{itemCount}</span>
            </div>
            <div className="summary-total">
              <span>Total estimado</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <WhatsAppCartButton />
            <p>
              WhatsApp abrira un mensaje con el detalle. Podras revisarlo antes
              de enviarlo.
            </p>
          </aside>
        </div>
      )}
    </main>
  )
}
