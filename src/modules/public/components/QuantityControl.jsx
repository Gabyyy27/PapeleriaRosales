import { Minus, Plus } from 'lucide-react'
import { MAX_CART_QUANTITY } from '../services/cart.service'

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max = MAX_CART_QUANTITY,
  label = 'Cantidad',
}) {
  function handleInputChange(event) {
    const nextValue = Number(event.target.value)

    if (Number.isFinite(nextValue)) {
      onChange(Math.min(max, Math.max(min, nextValue)))
    }
  }

  return (
    <div className="quantity-control">
      <button
        aria-label={`Reducir ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        type="button"
      >
        <Minus aria-hidden="true" size={16} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        max={max}
        min={min}
        onChange={handleInputChange}
        type="number"
        value={value}
      />
      <button
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        type="button"
      >
        <Plus aria-hidden="true" size={16} />
      </button>
    </div>
  )
}
