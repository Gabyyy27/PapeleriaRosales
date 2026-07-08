import { env } from '../config/env'

export const publicPaths = {
  home: '/',
  catalog: '/catalogo',
  cart: '/carrito',
  services: '/servicios',
  login: '/login',
}

export function getProductPath(slug) {
  return `${publicPaths.catalog}/${encodeURIComponent(slug)}`
}

export const adminPaths = {
  root: `/${env.adminRouteSlug}`,
}

export function getLoginPath(redirectTo) {
  if (!redirectTo) {
    return publicPaths.login
  }

  return `${publicPaths.login}?redirectTo=${encodeURIComponent(redirectTo)}`
}
