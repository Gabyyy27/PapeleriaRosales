import { useEffect, useRef } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Star,
  Trash2,
} from 'lucide-react'
import { toast } from '../../../lib/toasts'
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGES,
  validateProductImageFile,
} from '../services/productImages.service'

function createTempId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `new-image-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function getImageUrl(image) {
  return image.kind === 'new' ? image.previewUrl : image.publicUrl
}

export function ProductImageUploader({ images, onChange, disabled = false }) {
  const latestImages = useRef(images)

  useEffect(() => {
    latestImages.current = images
  }, [images])

  useEffect(() => {
    return () => {
      latestImages.current.forEach((image) => {
        if (image.kind === 'new') {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
    }
  }, [])

  function handleFiles(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) {
      return
    }

    if (images.length + files.length > MAX_PRODUCT_IMAGES) {
      toast.error(
        'Demasiadas imagenes',
        `Cada producto admite hasta ${MAX_PRODUCT_IMAGES} imagenes.`,
      )
      return
    }

    const validImages = []

    for (const file of files) {
      const validationError = validateProductImageFile(file)

      if (validationError) {
        toast.error('Imagen no valida', `${file.name}: ${validationError}`)
        continue
      }

      validImages.push({
        id: createTempId(),
        kind: 'new',
        file,
        previewUrl: URL.createObjectURL(file),
        altText: file.name,
      })
    }

    if (validImages.length > 0) {
      onChange([...images, ...validImages])
      toast.success('Imagenes listas', 'Se agregaron para subir al guardar.')
    }
  }

  function removeImage(imageId) {
    const image = images.find((item) => item.id === imageId)

    if (image?.kind === 'new') {
      URL.revokeObjectURL(image.previewUrl)
    }

    onChange(images.filter((item) => item.id !== imageId))
  }

  function moveImage(index, direction) {
    const nextIndex = index + direction

    if (nextIndex < 0 || nextIndex >= images.length) {
      return
    }

    const nextImages = [...images]
    const [item] = nextImages.splice(index, 1)
    nextImages.splice(nextIndex, 0, item)
    onChange(nextImages)
  }

  function setMainImage(index) {
    if (index === 0) {
      return
    }

    const nextImages = [...images]
    const [item] = nextImages.splice(index, 1)
    nextImages.unshift(item)
    onChange(nextImages)
  }

  const canAddMore = images.length < MAX_PRODUCT_IMAGES
  const hasMultipleImages = images.length > 1

  return (
    <section className="image-uploader" aria-label="Imagenes del producto">
      <div className="image-uploader-grid">
        {images.map((image, index) => (
          <article className="image-uploader-item" key={image.id}>
            <div className="image-uploader-preview">
              <img
                alt={image.altText || `Imagen ${index + 1}`}
                decoding="async"
                loading="lazy"
                src={getImageUrl(image)}
              />
              {index === 0 ? (
                <span className="main-image-label">
                  <Star aria-hidden="true" size={13} />
                  Principal
                </span>
              ) : null}
            </div>

            <div className="image-uploader-actions">
              {hasMultipleImages ? (
                <>
                  <button
                    aria-label="Mover imagen arriba"
                    disabled={disabled || index === 0}
                    onClick={() => moveImage(index, -1)}
                    title="Mover arriba"
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" size={16} />
                  </button>
                  <button
                    aria-label="Mover imagen abajo"
                    disabled={disabled || index === images.length - 1}
                    onClick={() => moveImage(index, 1)}
                    title="Mover abajo"
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" size={16} />
                  </button>
                  <button
                    aria-label="Marcar como imagen principal"
                    disabled={disabled || index === 0}
                    onClick={() => setMainImage(index)}
                    title="Hacer principal"
                    type="button"
                  >
                    <Star aria-hidden="true" size={16} />
                  </button>
                </>
              ) : null}
              <button
                aria-label="Quitar imagen"
                disabled={disabled}
                onClick={() => removeImage(image.id)}
                title="Quitar"
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>
          </article>
        ))}

        {canAddMore ? (
          <label className="image-uploader-drop">
            <ImagePlus aria-hidden="true" size={26} />
            <span>Agregar imagen</span>
            <small>JPG, PNG o WEBP. Max. 5 MB</small>
            <input
              accept={ALLOWED_PRODUCT_IMAGE_TYPES.join(',')}
              disabled={disabled}
              multiple
              onChange={handleFiles}
              type="file"
            />
          </label>
        ) : null}
      </div>
    </section>
  )
}
