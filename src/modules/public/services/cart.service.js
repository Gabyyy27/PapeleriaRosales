import { formatCurrency } from '../utils/currency'

export const CART_STORAGE_KEY = 'papeleria-rosales:public-cart:v1'
export const MAX_CART_QUANTITY = 99

function clampQuantity(quantity) {
  return Math.min(
    MAX_CART_QUANTITY,
    Math.max(1, Math.trunc(Number(quantity) || 1)),
  )
}

function normalizeStoredItem(item) {
  if (!item?.productId || !item?.name || !item?.slug) {
    return null
  }

  return {
    productId: String(item.productId),
    slug: String(item.slug),
    name: String(item.name),
    salePrice: Math.max(0, Number(item.salePrice) || 0),
    imageUrl: item.imageUrl ? String(item.imageUrl) : '',
    imageAlt: item.imageAlt ? String(item.imageAlt) : '',
    quantity: clampQuantity(item.quantity),
  }
}

export function readCart() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedCart = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) ?? '[]',
    )

    if (!Array.isArray(storedCart)) {
      return []
    }

    return storedCart.map(normalizeStoredItem).filter(Boolean)
  } catch {
    return []
  }
}

export function saveCart(items) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

export function addProductToCart(items, product, quantity = 1) {
  const requestedQuantity = clampQuantity(quantity)
  const existingItem = items.find((item) => item.productId === product.id)
  const primaryImage = product.images?.[0]

  if (!existingItem) {
    return [
      ...items,
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        salePrice: product.salePrice,
        imageUrl: primaryImage?.url ?? '',
        imageAlt: primaryImage?.alt || product.name,
        quantity: requestedQuantity,
      },
    ]
  }

  return items.map((item) =>
    item.productId === product.id
      ? {
          ...item,
          name: product.name,
          slug: product.slug,
          salePrice: product.salePrice,
          imageUrl: primaryImage?.url ?? '',
          imageAlt: primaryImage?.alt || product.name,
          quantity: clampQuantity(item.quantity + requestedQuantity),
        }
      : item,
  )
}

export function updateCartItemQuantity(items, productId, quantity) {
  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: clampQuantity(quantity) }
      : item,
  )
}

export function getCartSummary(items) {
  return items.reduce(
    (summary, item) => {
      summary.itemCount += item.quantity
      summary.subtotal += item.salePrice * item.quantity
      return summary
    },
    { itemCount: 0, subtotal: 0 },
  )
}

export function buildWhatsAppOrderMessage(items) {
  const { subtotal } = getCartSummary(items)
  const productLines = items.flatMap((item, index) => [
    `${index + 1}. ${item.name}`,
    `   Cantidad: ${item.quantity}`,
    `   Precio unitario: ${formatCurrency(item.salePrice)}`,
    `   Subtotal: ${formatCurrency(item.salePrice * item.quantity)}`,
    '',
  ])

  return [
    'Hola, Papeleria Rosales. Quiero solicitar este pedido:',
    '',
    ...productLines,
    `Total estimado: ${formatCurrency(subtotal)}`,
    '',
    'Por favor confirmen disponibilidad y total final. Gracias.',
  ].join('\n')
}

export function getWhatsAppOrderUrl(phoneNumber, items) {
  if (items.length === 0) {
    throw new Error('El carrito esta vacio.')
  }

  const normalizedPhone = String(phoneNumber).replace(/\D/g, '')

  if (!normalizedPhone) {
    throw new Error('El numero de WhatsApp no esta configurado.')
  }

  const message = buildWhatsAppOrderMessage(items)
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
