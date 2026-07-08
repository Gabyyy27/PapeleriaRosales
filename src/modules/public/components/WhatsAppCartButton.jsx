import { MessageCircle } from 'lucide-react'
import { env } from '../../../config/env'
import { toast } from '../../../lib/toasts'
import { useCart } from '../cart/useCart'
import { getWhatsAppOrderUrl } from '../services/cart.service'

export function WhatsAppCartButton({ className = '' }) {
  const { items } = useCart()

  function handleSendOrder() {
    try {
      const orderUrl = getWhatsAppOrderUrl(env.whatsappNumber, items)
      window.open(orderUrl, '_blank', 'noopener,noreferrer')
      toast.success(
        'Pedido preparado',
        'Revisa el mensaje antes de enviarlo por WhatsApp.',
      )
    } catch (error) {
      toast.error('No se pudo preparar el pedido', error.message)
    }
  }

  return (
    <button
      className={`whatsapp-button ${className}`.trim()}
      disabled={items.length === 0}
      onClick={handleSendOrder}
      type="button"
    >
      <MessageCircle aria-hidden="true" size={20} />
      Pedir por WhatsApp
    </button>
  )
}
