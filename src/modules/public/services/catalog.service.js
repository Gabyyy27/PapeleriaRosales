import { supabase } from '../../../lib/supabaseClient'

export const CATALOG_PAGE_SIZE = 12

const CATALOG_COLUMNS = `
  id,
  org_id,
  category_id,
  category_name,
  name,
  slug,
  description,
  sku,
  stock,
  sale_price,
  images
`

function createCatalogError(message, cause) {
  const error = new Error(message)
  error.cause = cause
  return error
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Solicitud cancelada', 'AbortError')
  }
}

function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .filter((image) => image?.url)
    .sort((first, second) => (first.position ?? 0) - (second.position ?? 0))
    .slice(0, 5)
    .map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt || '',
      position: image.position,
    }))
}

function normalizeProduct(product) {
  return {
    id: product.id,
    orgId: product.org_id,
    categoryId: product.category_id,
    categoryName: product.category_name,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    stock: Math.max(0, Number(product.stock) || 0),
    salePrice: Math.max(0, Number(product.sale_price) || 0),
    images: normalizeImages(product.images),
  }
}

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, '\\$&')
}

export async function getCatalogProducts({
  page = 1,
  pageSize = CATALOG_PAGE_SIZE,
  search = '',
  categoryId = '',
  signal,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('catalog_products')
    .select(CATALOG_COLUMNS, { count: 'exact' })

  const normalizedSearch = search.trim()

  if (normalizedSearch) {
    query = query.ilike('name', `%${escapeLikePattern(normalizedSearch)}%`)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  let paginatedQuery = query
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (signal) {
    paginatedQuery = paginatedQuery.abortSignal(signal)
  }

  const { data, error, count } = await paginatedQuery

  throwIfAborted(signal)

  if (error) {
    throw createCatalogError('No se pudo cargar el catalogo.', error)
  }

  return {
    products: (data ?? []).map(normalizeProduct),
    total: count ?? 0,
    page: safePage,
    pageSize,
  }
}

export async function getPublicCategories({ signal } = {}) {
  let query = supabase
    .from('product_categories')
    .select('id, name, slug, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  throwIfAborted(signal)

  if (error) {
    throw createCatalogError('No se pudieron cargar las categorias.', error)
  }

  return data ?? []
}

export async function getCatalogProductBySlug(slug, { signal } = {}) {
  let query = supabase
    .from('catalog_products')
    .select(CATALOG_COLUMNS)
    .eq('slug', slug)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.maybeSingle()

  throwIfAborted(signal)

  if (error) {
    throw createCatalogError('No se pudo cargar el producto.', error)
  }

  return data ? normalizeProduct(data) : null
}
