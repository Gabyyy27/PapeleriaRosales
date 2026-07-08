import { useCallback, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../modules/public/cart/useCart'
import { CartDrawer } from '../modules/public/components/CartDrawer'
import { publicPaths } from '../routes/paths'

export function PublicLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { itemCount } = useCart()
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to={publicPaths.home}>
          <span className="brand-mark" aria-hidden="true">
            PR
          </span>
          <span>
            <strong>Papeleria Rosales</strong>
            <small>Utiles, copias y servicios</small>
          </span>
        </NavLink>

        <nav className="site-nav" aria-label="Navegacion publica">
          <NavLink to={publicPaths.home}>Inicio</NavLink>
          <NavLink to={publicPaths.catalog}>Catalogo</NavLink>
          <NavLink to={publicPaths.services}>Servicios</NavLink>
        </nav>

        <button
          aria-label={`Abrir carrito con ${itemCount} productos`}
          className="header-cart-button"
          onClick={() => setIsCartOpen(true)}
          type="button"
        >
          <ShoppingBag aria-hidden="true" size={20} />
          <span>Carrito</span>
          {itemCount > 0 ? (
            <strong aria-hidden="true">
              {itemCount > 99 ? '99+' : itemCount}
            </strong>
          ) : null}
        </button>
      </header>

      <Outlet />
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </div>
  )
}
