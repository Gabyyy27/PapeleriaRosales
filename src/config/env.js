const requiredEnv = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_ADMIN_ROUTE_SLUG: import.meta.env.VITE_ADMIN_ROUTE_SLUG,
}

export const missingEnvVars = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key)

export function assertRequiredEnv() {
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missingEnvVars.join(', ')}`,
    )
  }
}

function getRequiredEnv(key) {
  const value = requiredEnv[key]

  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${key}`)
  }

  return value
}

export const env = {
  supabaseUrl: getRequiredEnv('VITE_SUPABASE_URL'),
  supabasePublishableKey: getRequiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  adminRouteSlug: getRequiredEnv('VITE_ADMIN_ROUTE_SLUG')
    .trim()
    .replace(/^\/+|\/+$/g, ''),
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
}

if (!env.adminRouteSlug) {
  throw new Error('VITE_ADMIN_ROUTE_SLUG no puede estar vacio.')
}
