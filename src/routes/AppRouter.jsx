import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { CategoriesPage } from '../modules/products/pages/CategoriesPage'
import { ProductFormPage } from '../modules/products/pages/ProductFormPage'
import { ProductsPage } from '../modules/products/pages/ProductsPage'
import { AdminHomePage } from '../pages/admin/AdminHomePage'
import { CartPage } from '../pages/public/CartPage'
import { CatalogPage } from '../pages/public/CatalogPage'
import { HomePage } from '../pages/public/HomePage'
import { LoginPage } from '../pages/public/LoginPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'
import { ProductDetailPage } from '../pages/public/ProductDetailPage'
import { ServicesPage } from '../pages/public/ServicesPage'
import { adminPaths, publicPaths } from './paths'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path={publicPaths.catalog.slice(1)} element={<CatalogPage />} />
          <Route
            path={`${publicPaths.catalog.slice(1)}/:productSlug`}
            element={<ProductDetailPage />}
          />
          <Route path={publicPaths.cart.slice(1)} element={<CartPage />} />
          <Route path={publicPaths.services.slice(1)} element={<ServicesPage />} />
          <Route path={publicPaths.login.slice(1)} element={<LoginPage />} />
        </Route>

        <Route
          path={`${adminPaths.root.slice(1)}/*`}
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route
            path="productos/nuevo"
            element={<ProductFormPage mode="create" />}
          />
          <Route
            path="productos/:productId/editar"
            element={<ProductFormPage mode="edit" />}
          />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="*" element={<Navigate replace to={adminPaths.root} />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
