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

adminPaths.products = `${adminPaths.root}/productos`
adminPaths.newProduct = `${adminPaths.products}/nuevo`
adminPaths.categories = `${adminPaths.root}/categorias`
adminPaths.productEdit = (id) =>
  `${adminPaths.products}/${encodeURIComponent(id)}/editar`

export function getLoginPath(redirectTo) {
  if (!redirectTo) {
    return publicPaths.login
  }

  return `${publicPaths.login}?redirectTo=${encodeURIComponent(redirectTo)}`
}
