import { env } from '../config/env'

export const publicPaths = {
  home: '/',
  catalog: '/catalogo',
  services: '/servicios',
  login: '/login',
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
