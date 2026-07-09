import { supabase } from '../../lib/supabaseClient'

export const ADMIN_ROLES = ['owner', 'admin']

function createOrganizationError(message, cause) {
  const error = new Error(message)
  error.cause = cause
  return error
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Solicitud cancelada', 'AbortError')
  }
}

function getSingleRelation(value) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeMembership(row) {
  if (!row) {
    return null
  }

  const organization = getSingleRelation(row.organizations)

  return {
    id: row.org_id,
    name: organization?.name ?? 'Papeleria Rosales',
    slug: organization?.slug ?? '',
    role: row.role,
    canManageProducts: ADMIN_ROLES.includes(row.role),
  }
}

export async function getCurrentOrganization({ signal } = {}) {
  let query = supabase
    .from('organization_members')
    .select(
      `
        org_id,
        role,
        created_at,
        organizations:org_id (
          id,
          name,
          slug
        )
      `,
    )
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.maybeSingle()

  throwIfAborted(signal)

  if (error) {
    throw createOrganizationError('No se pudo validar la organizacion.', error)
  }

  return normalizeMembership(data)
}
