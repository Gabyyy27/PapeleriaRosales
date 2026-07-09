import { supabase } from '../../../lib/supabaseClient'
import { createUniqueSlug } from '../../../shared/utils/slug'
import { getProductImagesByProductIds } from './productImages.service'

export const ADMIN_PRODUCTS_PAGE_SIZE = 10
export const PRODUCT_STATUSES = ['active', 'inactive', 'archived']

const PRODUCT_LIST_COLUMNS = `
  id,
  org_id,
  category_id,
  name,
  slug,
  description,
  sku,
  barcode,
  stock,
  min_stock,
  sale_price,
  status,
  visible_public,
  updated_at,
  product_categories (
    name
  ),
  product_costs (
    unit_cost
  )
`

function createProductError(message, cause) {
  const error = new Error(message)
  error.cause = cause
  return error
}

export function isProductDeleteBlocked(error) {
  const cause = error?.cause ?? error

  return (
    cause?.code === '23503' ||
    cause?.message?.includes('violates foreign key constraint')
  )
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Solicitud cancelada', 'AbortError')
  }
}

function getSingleRelation(value) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeSearchForOr(value) {
  return value
    .trim()
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\\%_]/g, '\\$&')
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toInteger(value) {
  return Math.max(0, Math.trunc(toNumber(value)))
}

function normalizeProduct(product, images = []) {
  const category = getSingleRelation(product.product_categories)
  const cost = getSingleRelation(product.product_costs)
  const sortedImages = [...images].sort(
    (first, second) => first.position - second.position,
  )

  return {
    id: product.id,
    orgId: product.org_id,
    categoryId: product.category_id ?? '',
    categoryName: category?.name ?? '',
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    stock: Math.max(0, Number(product.stock) || 0),
    minStock: Math.max(0, Number(product.min_stock) || 0),
    unitCost: Math.max(0, Number(cost?.unit_cost) || 0),
    salePrice: Math.max(0, Number(product.sale_price) || 0),
    status: product.status,
    visiblePublic: Boolean(product.visible_public),
    updatedAt: product.updated_at,
    images: sortedImages,
    primaryImage: sortedImages[0],
  }
}

function buildProductPayload({ orgId, values, userId, includeSlug = false }) {
  const name = values.name.trim()

  if (!name) {
    throw createProductError('El nombre del producto es requerido.')
  }

  const payload = {
    org_id: orgId,
    category_id: values.categoryId || null,
    name,
    description: values.description?.trim() || null,
    sku: values.sku?.trim() || null,
    barcode: values.barcode?.trim() || null,
    stock: toInteger(values.stock),
    min_stock: toInteger(values.minStock),
    sale_price: toNumber(values.salePrice),
    status: values.status,
    visible_public: Boolean(values.visiblePublic),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }

  if (includeSlug) {
    payload.slug = createUniqueSlug(name, 'producto')
    payload.created_by = userId
  }

  return payload
}

async function attachImagesToProducts({ orgId, products, signal }) {
  const productIds = products.map((product) => product.id)
  const images = await getProductImagesByProductIds({
    orgId,
    productIds,
    signal,
  })
  const imagesByProductId = new Map()

  for (const image of images) {
    const current = imagesByProductId.get(image.productId) ?? []
    current.push(image)
    imagesByProductId.set(image.productId, current)
  }

  return products.map((product) =>
    normalizeProduct(product, imagesByProductId.get(product.id) ?? []),
  )
}

export async function getAdminProducts({
  orgId,
  page = 1,
  pageSize = ADMIN_PRODUCTS_PAGE_SIZE,
  search = '',
  status = '',
  categoryId = '',
  signal,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS, { count: 'exact' })
    .eq('org_id', orgId)

  const normalizedSearch = normalizeSearchForOr(search)

  if (normalizedSearch) {
    const pattern = `%${normalizedSearch}%`
    query = query.or(
      `name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern}`,
    )
  }

  if (PRODUCT_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  let paginatedQuery = query
    .order('updated_at', { ascending: false })
    .order('name', { ascending: true })
    .range(from, to)

  if (signal) {
    paginatedQuery = paginatedQuery.abortSignal(signal)
  }

  const { data, error, count } = await paginatedQuery

  throwIfAborted(signal)

  if (error) {
    throw createProductError('No se pudieron cargar los productos.', error)
  }

  return {
    products: await attachImagesToProducts({
      orgId,
      products: data ?? [],
      signal,
    }),
    total: count ?? 0,
    page: safePage,
    pageSize,
  }
}

export async function getAdminProductById({ orgId, productId, signal }) {
  let query = supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .eq('org_id', orgId)
    .eq('id', productId)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.maybeSingle()

  throwIfAborted(signal)

  if (error) {
    throw createProductError('No se pudo cargar el producto.', error)
  }

  if (!data) {
    return null
  }

  const [product] = await attachImagesToProducts({
    orgId,
    products: [data],
    signal,
  })

  return product
}

export async function createProduct({ orgId, values, userId }) {
  const { data, error } = await supabase
    .from('products')
    .insert(
      buildProductPayload({
        orgId,
        values,
        userId,
        includeSlug: true,
      }),
    )
    .select(PRODUCT_LIST_COLUMNS)
    .single()

  if (error) {
    throw createProductError('No se pudo crear el producto.', error)
  }

  return normalizeProduct(data)
}

export async function updateProduct({ orgId, productId, values, userId }) {
  const { data, error } = await supabase
    .from('products')
    .update(
      buildProductPayload({
        orgId,
        values,
        userId,
      }),
    )
    .eq('org_id', orgId)
    .eq('id', productId)
    .select(PRODUCT_LIST_COLUMNS)
    .maybeSingle()

  if (error) {
    throw createProductError('No se pudo actualizar el producto.', error)
  }

  if (!data) {
    throw createProductError('No tienes permisos sobre este producto.')
  }

  return normalizeProduct(data)
}

export async function saveProductCost({ orgId, productId, unitCost, userId }) {
  const { data, error } = await supabase
    .from('product_costs')
    .upsert(
      {
        product_id: productId,
        org_id: orgId,
        unit_cost: toNumber(unitCost),
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'product_id' },
    )
    .select('product_id, org_id, unit_cost')
    .single()

  if (error) {
    throw createProductError('No se pudo guardar el costo.', error)
  }

  return data
}

export async function archiveProduct({ orgId, productId, userId }) {
  const { data, error } = await supabase
    .from('products')
    .update({
      status: 'archived',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .eq('id', productId)
    .select('id, name, status')
    .maybeSingle()

  if (error) {
    throw createProductError('No se pudo archivar el producto.', error)
  }

  if (!data) {
    throw createProductError('No tienes permisos sobre este producto.')
  }

  return data
}

export async function deleteProduct({ orgId, productId }) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('org_id', orgId)
    .eq('id', productId)

  if (error) {
    if (isProductDeleteBlocked(error)) {
      throw createProductError(
        'El producto tiene ventas relacionadas. Archivarlo conserva el historial.',
        error,
      )
    }

    throw createProductError('No se pudo eliminar el producto.', error)
  }
}
