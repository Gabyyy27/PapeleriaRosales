import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductImage } from './ProductImage'

export function ProductGallery({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultipleImages = images.length > 1
  const activeImage = images[activeIndex]

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    )
  }

  function showNext() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    )
  }

  return (
    <section className="product-gallery" aria-label={`Galeria de ${productName}`}>
      <div className="product-gallery-main">
        <ProductImage
          alt={activeImage?.alt || productName}
          className="product-gallery-image"
          src={activeImage?.url}
        />

        {hasMultipleImages ? (
          <>
            <button
              aria-label="Imagen anterior"
              className="gallery-control gallery-control-previous"
              onClick={showPrevious}
              type="button"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              aria-label="Imagen siguiente"
              className="gallery-control gallery-control-next"
              onClick={showNext}
              type="button"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="product-thumbnails" aria-label="Elegir imagen">
          {images.map((image, index) => (
            <button
              aria-label={`Ver imagen ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={index === activeIndex ? 'active' : ''}
              key={image.id || image.url}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <ProductImage
                alt=""
                className="product-thumbnail-image"
                src={image.url}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
