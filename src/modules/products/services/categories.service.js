import { supabase } from '../../../lib/supabaseClient'
import { createUniqueSlug } from '../../../shared/utils/slug'

function createCategoryError(message, cause) {
  const error = new Error(message)
  error.cause = cause
  return error
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Solicitud cancelada', 'AbortError')
  }
}

function normalizeCategory(category) {
  return {
    id: category.id,
    orgId: category.org_id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    sortOrder: Number(category.sort_order) || 0,
    isActive: Boolean(category.is_active),
  }
}

export async function getProductCategories({
  orgId,
  includeInactive = false,
  signal,
} = {}) {
  let query = supabase
    .from('product_categories')
    .select('id, org_id, name, slug, description, sort_order, is_active')
    .eq('org_id', orgId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  throwIfAborted(signal)

  if (error) {
    throw createCategoryError('No se pudieron cargar las categorias.', error)
  }

  return (data ?? []).map(normalizeCategory)
}

export async function createCategory({ orgId, values }) {
  const name = values.name.trim()

  if (!name) {
    throw createCategoryError('El nombre de la categoria es requerido.')
  }

  const { data, error } = await supabase
    .from('product_categories')
    .insert({
      org_id: orgId,
      name,
      slug: createUniqueSlug(name, 'categoria'),
      description: values.description?.trim() || null,
      sort_order: Number(values.sortOrder) || 0,
      is_active: Boolean(values.isActive),
    })
    .select('id, org_id, name, slug, description, sort_order, is_active')
    .single()

  if (error) {
    throw createCategoryError('No se pudo crear la categoria.', error)
  }

  return normalizeCategory(data)
}

export async function updateCategory({ orgId, categoryId, values }) {
  const name = values.name.trim()

  if (!name) {
    throw createCategoryError('El nombre de la categoria es requerido.')
  }

  const { data, error } = await supabase
    .from('product_categories')
    .update({
      name,
      description: values.description?.trim() || null,
      sort_order: Number(values.sortOrder) || 0,
      is_active: Boolean(values.isActive),
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .eq('id', categoryId)
    .select('id, org_id, name, slug, description, sort_order, is_active')
    .maybeSingle()

  if (error) {
    throw createCategoryError('No se pudo actualizar la categoria.', error)
  }

  if (!data) {
    throw createCategoryError('No tienes permisos sobre esta categoria.')
  }

  return normalizeCategory(data)
}

export async function setCategoryActive({ orgId, categoryId, isActive }) {
  const { data, error } = await supabase
    .from('product_categories')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .eq('id', categoryId)
    .select('id, org_id, name, slug, description, sort_order, is_active')
    .maybeSingle()

  if (error) {
    throw createCategoryError('No se pudo cambiar la categoria.', error)
  }

  if (!data) {
    throw createCategoryError('No tienes permisos sobre esta categoria.')
  }

  return normalizeCategory(data)
}

export async function deleteCategory({ orgId, categoryId }) {
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('org_id', orgId)
    .eq('id', categoryId)

  if (error) {
    throw createCategoryError('No se pudo eliminar la categoria.', error)
  }
}
