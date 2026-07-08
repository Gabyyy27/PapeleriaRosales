import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '../../../lib/toasts'
import {
  addProductToCart,
  getCartSummary,
  readCart,
  saveCart,
  updateCartItemQuantity,
} from '../services/cart.service'
import { CartContext } from './cart-context'

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    try {
      saveCart(items)
    } catch {
      toast.error(
        'No se pudo guardar el carrito',
        'Revisa el almacenamiento disponible del navegador.',
      )
    }
  }, [items])

  const addProduct = useCallback((product, quantity) => {
    setItems((currentItems) =>
      addProductToCart(currentItems, product, quantity),
    )
  }, [])

  const removeProduct = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    )
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setItems((currentItems) =>
      updateCartItemQuantity(currentItems, productId, quantity),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const summary = useMemo(() => getCartSummary(items), [items])
  const value = useMemo(
    () => ({
      items,
      ...summary,
      addProduct,
      removeProduct,
      setQuantity,
      clearCart,
    }),
    [addProduct, clearCart, items, removeProduct, setQuantity, summary],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
