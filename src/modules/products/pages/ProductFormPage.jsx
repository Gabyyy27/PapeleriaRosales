import { useEffect, useState } from 'react'
import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'
import { toast } from '../../../lib/toasts'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useAdminOrganization } from '../../../shared/hooks/useAdminOrganization'
import { adminPaths } from '../../../routes/paths'
import { ProductForm } from '../components/ProductForm'
import { getProductCategories } from '../services/categories.service'
import {
  createProduct,
  getAdminProductById,
  saveProductCost,
  updateProduct,
} from '../services/products.service'
import { saveProductImages } from '../services/productImages.service'

function imagesChanged(previousImages, imageItems) {
  if (previousImages.length !== imageItems.length) {
    return true
  }

  return imageItems.some((item, index) => {
    const previous = previousImages[index]

    return item.kind === 'new' || item.id !== previous?.id
  })
}

export function ProductFormPage({ mode }) {
  const isEditing = mode === 'edit'
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loading: loadingOrg, organization, error: orgError } =
    useAdminOrganization()
  const [categories, setCategories] = useState([])
  const [product, setProduct] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!organization?.id || !organization.canManageProducts) {
      return
    }

    const controller = new AbortController()

    async function loadData() {
      setLoadingData(true)
      setLoadError(null)

      try {
        const [nextCategories, nextProduct] = await Promise.all([
          getProductCategories({
            orgId: organization.id,
            includeInactive: true,
            signal: controller.signal,
          }),
          isEditing
            ? getAdminProductById({
                orgId: organization.id,
                productId,
                signal: controller.signal,
              })
            : Promise.resolve(null),
        ])

        setCategories(nextCategories)
        setProduct(nextProduct)
        setLoadingData(false)
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setLoadError(error)
        setLoadingData(false)
        toast.error(
          'No se pudo cargar el formulario',
          error.cause?.message ?? error.message,
        )
      }
    }

    loadData()

    return () => controller.abort()
  }, [isEditing, organization, productId])

  async function handleSubmit({ values, imageItems, previousImages }) {
    if (!organization?.id) {
      toast.error('No hay organizacion activa')
      return
    }

    setSubmitting(true)

    let savedProduct = null

    try {
      savedProduct = isEditing
        ? await updateProduct({
            orgId: organization.id,
            productId,
            values,
            userId: user?.id,
          })
        : await createProduct({
            orgId: organization.id,
            values,
            userId: user?.id,
          })

      await saveProductCost({
        orgId: organization.id,
        productId: savedProduct.id,
        unitCost: values.unitCost,
        userId: user?.id,
      })

      if (imagesChanged(previousImages, imageItems)) {
        const { cleanupError } = await saveProductImages({
          orgId: organization.id,
          productId: savedProduct.id,
          productName: values.name,
          imageItems,
          previousImages,
        })

        if (cleanupError) {
          toast.warning(
            'Producto guardado',
            'No se pudieron limpiar algunos archivos anteriores del bucket.',
          )
        }
      }

      toast.success(
        isEditing ? 'Producto actualizado' : 'Producto creado',
        values.name,
      )
      navigate(adminPaths.productEdit(savedProduct.id), { replace: true })
    } catch (error) {
      if (savedProduct?.id) {
        console.error(error)
        toast.error(
          'Producto guardado parcialmente',
          error.cause?.message ?? error.message,
        )
        navigate(adminPaths.productEdit(savedProduct.id), { replace: true })
      } else {
        console.error(error)
        toast.error(
          isEditing ? 'No se pudo actualizar' : 'No se pudo crear',
          error.cause?.message ?? error.message,
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingOrg || (organization?.canManageProducts && loadingData)) {
    return (
      <main className="admin-content">
        <div className="admin-loading-state">Cargando producto...</div>
      </main>
    )
  }

  if (orgError || !organization) {
    return (
      <main className="admin-content">
        <EmptyState
          title="No hay organizacion disponible"
          description="Tu usuario debe pertenecer a Papeleria Rosales para administrar productos."
          tone="warning"
        />
      </main>
    )
  }

  if (!organization.canManageProducts) {
    return (
      <main className="admin-content">
        <EmptyState
          title="Permisos insuficientes"
          description="Solo usuarios owner o admin pueden crear o editar productos."
          tone="warning"
        />
      </main>
    )
  }

  if (loadError || (isEditing && !product)) {
    return (
      <main className="admin-content">
        <EmptyState
          action={
            <Link className="secondary-link" to={adminPaths.products}>
              Volver a productos
            </Link>
          }
          icon={PackageSearch}
          title="Producto no disponible"
          description="No se encontro el producto o no tienes permisos para verlo."
          tone="warning"
        />
      </main>
    )
  }

  return (
    <main className="admin-content product-form-page">
      <Link className="back-link" to={adminPaths.products}>
        <ArrowLeft aria-hidden="true" size={18} />
        Volver a productos
      </Link>

      <ProductForm
        categories={categories}
        mode={mode}
        onSubmit={handleSubmit}
        product={product}
        submitting={submitting}
      />
    </main>
  )
}
