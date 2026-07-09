import { supabase } from '../../../lib/supabaseClient'
import { createSlug } from '../../../shared/utils/slug'

export const PRODUCT_IMAGE_BUCKET = 'product-images'
export const MAX_PRODUCT_IMAGES = 5
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MIME_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const EXTENSION_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function createImageError(message, cause) {
  const error = new Error(message)
  error.cause = cause
  return error
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Solicitud cancelada', 'AbortError')
  }
}

function normalizeImage(image) {
  return {
    id: image.id,
    orgId: image.org_id,
    productId: image.product_id,
    storageBucket: image.storage_bucket,
    storagePath: image.storage_path,
    publicUrl: image.public_url,
    altText: image.alt_text ?? '',
    position: image.position,
  }
}

function getFileExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function resolveProductImageType(file) {
  if (ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return file.type
  }

  if (file.type) {
    return null
  }

  return EXTENSION_MIME[getFileExtension(file.name)] ?? null
}

function createStoragePath({ orgId, productId, productName, file }) {
  const imageType = resolveProductImageType(file)
  const extension = MIME_EXTENSION[imageType]
  const cleanName = createSlug(productName, 'producto')
  const uniquePart =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    Date.now().toString(36).slice(-8)

  return `${orgId}/${productId}/${Date.now()}-${cleanName}-${uniquePart}.${extension}`
}

export function validateProductImageFile(file) {
  if (!file) {
    return 'Selecciona una imagen.'
  }

  if (!resolveProductImageType(file)) {
    return 'Solo se permiten imagenes JPG, PNG o WEBP.'
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return 'Cada imagen debe pesar 5 MB o menos.'
  }

  return null
}

export async function getProductImages({ orgId, productId, signal } = {}) {
  let query = supabase
    .from('product_images')
    .select(
      'id, org_id, product_id, storage_bucket, storage_path, public_url, alt_text, position',
    )
    .eq('org_id', orgId)
    .eq('product_id', productId)
    .order('position', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  throwIfAborted(signal)

  if (error) {
    throw createImageError('No se pudieron cargar las imagenes.', error)
  }

  return (data ?? []).map(normalizeImage)
}

export async function getProductImagesByProductIds({
  orgId,
  productIds,
  signal,
} = {}) {
  if (!productIds?.length) {
    return []
  }

  let query = supabase
    .from('product_images')
    .select(
      'id, org_id, product_id, storage_bucket, storage_path, public_url, alt_text, position',
    )
    .eq('org_id', orgId)
    .in('product_id', productIds)
    .order('position', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  throwIfAborted(signal)

  if (error) {
    throw createImageError('No se pudieron cargar las imagenes.', error)
  }

  return (data ?? []).map(normalizeImage)
}

async function uploadImageFile({ orgId, productId, productName, file }) {
  const validationError = validateProductImageFile(file)

  if (validationError) {
    throw createImageError(validationError)
  }

  const storagePath = createStoragePath({
    orgId,
    productId,
    productName,
    file,
  })
  const imageType = resolveProductImageType(file)

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: imageType,
      upsert: false,
    })

  if (uploadError) {
    throw createImageError('No se pudo subir la imagen.', uploadError)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(storagePath)

  return {
    storageBucket: PRODUCT_IMAGE_BUCKET,
    storagePath,
    publicUrl,
    altText: productName,
  }
}

async function insertImageMetadata({ orgId, productId, images }) {
  if (images.length === 0) {
    return []
  }

  const rows = images.map((image, index) => ({
    org_id: orgId,
    product_id: productId,
    storage_bucket: image.storageBucket ?? PRODUCT_IMAGE_BUCKET,
    storage_path: image.storagePath,
    public_url: image.publicUrl,
    alt_text: image.altText || null,
    position: index + 1,
  }))

  const { data, error } = await supabase
    .from('product_images')
    .insert(rows, { defaultToNull: false })
    .select(
      'id, org_id, product_id, storage_bucket, storage_path, public_url, alt_text, position',
    )
    .order('position', { ascending: true })

  if (error) {
    throw createImageError(
      'No se pudo guardar la metadata de imagenes.',
      error,
    )
  }

  return (data ?? []).map(normalizeImage)
}

export async function removeProductImageFiles(images) {
  const paths = (images ?? [])
    .map((image) => image.storagePath)
    .filter(Boolean)

  if (paths.length === 0) {
    return null
  }

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove(paths)

  if (error) {
    throw createImageError(
      'No se pudieron eliminar algunos archivos de imagen.',
      error,
    )
  }

  return null
}

export async function saveProductImages({
  orgId,
  productId,
  productName,
  imageItems,
  previousImages = [],
}) {
  if (imageItems.length > MAX_PRODUCT_IMAGES) {
    throw createImageError('Un producto solo puede tener hasta 5 imagenes.')
  }

  const uploadedImages = []

  try {
    const finalImages = []

    for (const item of imageItems) {
      if (item.kind === 'new') {
        const uploadedImage = await uploadImageFile({
          orgId,
          productId,
          productName,
          file: item.file,
        })

        uploadedImages.push(uploadedImage)
        finalImages.push(uploadedImage)
      } else {
        finalImages.push({
          id: item.id,
          storageBucket: item.storageBucket,
          storagePath: item.storagePath,
          publicUrl: item.publicUrl,
          altText: item.altText || productName,
        })
      }
    }

    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('org_id', orgId)
      .eq('product_id', productId)

    if (deleteError) {
      throw createImageError(
        'No se pudo reemplazar el orden de imagenes.',
        deleteError,
      )
    }

    const images = await insertImageMetadata({
      orgId,
      productId,
      images: finalImages,
    })

    const remainingIds = new Set(
      imageItems
        .filter((item) => item.kind === 'existing')
        .map((item) => item.id),
    )
    const removedImages = previousImages.filter(
      (image) => !remainingIds.has(image.id),
    )

    let cleanupError = null

    try {
      await removeProductImageFiles(removedImages)
    } catch (error) {
      cleanupError = error
    }

    return {
      images,
      cleanupError,
    }
  } catch (error) {
    if (uploadedImages.length > 0) {
      try {
        await removeProductImageFiles(uploadedImages)
      } catch {
        // La operacion principal ya fallo; este intento evita archivos huerfanos.
      }
    }

    throw error
  }
}
