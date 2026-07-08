import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'

export function ProductImage({ src, alt, className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div className={`${className} product-image-placeholder`}>
        <ImageOff aria-hidden="true" size={28} />
        <span>Imagen no disponible</span>
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading={loading}
      onError={() => setFailed(true)}
      src={src}
    />
  )
}
