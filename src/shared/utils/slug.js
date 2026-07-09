export function createSlug(value, fallback = 'item') {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || fallback
}

export function createUniqueSlug(value, fallback = 'item') {
  const suffix =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    Date.now().toString(36).slice(-8)

  return `${createSlug(value, fallback)}-${suffix}`
}
