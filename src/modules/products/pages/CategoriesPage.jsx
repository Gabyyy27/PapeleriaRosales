import { useEffect, useState } from 'react'
import { FolderPlus, Pencil, Power, Trash2 } from 'lucide-react'
import { toast } from '../../../lib/toasts'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { EmptyState } from '../../../shared/components/EmptyState'
import { FormField } from '../../../shared/components/FormField'
import { useAdminOrganization } from '../../../shared/hooks/useAdminOrganization'
import {
  createCategory,
  deleteCategory,
  getProductCategories,
  setCategoryActive,
  updateCategory,
} from '../services/categories.service'

const EMPTY_FORM = {
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
}

export function CategoriesPage() {
  const { loading: loadingOrg, organization, error: orgError } =
    useAdminOrganization()
  const [categories, setCategories] = useState([])
  const [formValues, setFormValues] = useState(EMPTY_FORM)
  const [editingCategory, setEditingCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmCategory, setConfirmCategory] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!organization?.id || !organization.canManageProducts) {
      return
    }

    const controller = new AbortController()

    setLoading(true)

    getProductCategories({
      orgId: organization.id,
      includeInactive: true,
      signal: controller.signal,
    })
      .then((data) => {
        setCategories(data)
        setLoading(false)
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return
        }

        setLoading(false)
        toast.error(
          'No se pudieron cargar las categorias',
          error.cause?.message ?? error.message,
        )
      })

    return () => controller.abort()
  }, [organization, retryKey])

  function updateForm(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function startEdit(category) {
    setEditingCategory(category)
    setFormValues({
      name: category.name,
      description: category.description,
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    })
  }

  function resetForm() {
    setEditingCategory(null)
    setFormValues(EMPTY_FORM)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formValues.name.trim()) {
      toast.error('Nombre requerido', 'No puedes guardar una categoria sin nombre.')
      return
    }

    setSubmitting(true)

    try {
      if (editingCategory) {
        await updateCategory({
          orgId: organization.id,
          categoryId: editingCategory.id,
          values: formValues,
        })
        toast.success('Categoria actualizada', formValues.name)
      } else {
        await createCategory({
          orgId: organization.id,
          values: formValues,
        })
        toast.success('Categoria creada', formValues.name)
      }

      resetForm()
      setRetryKey((current) => current + 1)
    } catch (error) {
      toast.error(
        editingCategory ? 'No se pudo actualizar' : 'No se pudo crear',
        error.cause?.message ?? error.message,
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleCategory(category) {
    try {
      await setCategoryActive({
        orgId: organization.id,
        categoryId: category.id,
        isActive: !category.isActive,
      })
      toast.success(
        category.isActive ? 'Categoria desactivada' : 'Categoria activada',
        category.name,
      )
      setRetryKey((current) => current + 1)
    } catch (error) {
      toast.error('No se pudo cambiar la categoria', error.message)
    }
  }

  async function confirmDelete() {
    if (!confirmCategory) {
      return
    }

    setSubmitting(true)

    try {
      await deleteCategory({
        orgId: organization.id,
        categoryId: confirmCategory.id,
      })
      toast.success('Categoria eliminada', confirmCategory.name)
      setConfirmCategory(null)
      setRetryKey((current) => current + 1)
    } catch (error) {
      toast.error('No se pudo eliminar', error.cause?.message ?? error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingOrg) {
    return (
      <main className="admin-content">
        <div className="admin-loading-state">Validando organizacion...</div>
      </main>
    )
  }

  if (orgError || !organization) {
    return (
      <main className="admin-content">
        <EmptyState
          title="No hay organizacion disponible"
          description="Tu usuario debe pertenecer a Papeleria Rosales para administrar categorias."
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
          description="Solo usuarios owner o admin pueden gestionar categorias."
          tone="warning"
        />
      </main>
    )
  }

  return (
    <main className="admin-content categories-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Categorias</p>
          <h1>Organizacion del catalogo</h1>
          <p>Administra las familias de productos usadas en el catalogo.</p>
        </div>
      </section>

      <section className="category-admin-layout">
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <p className="eyebrow">
              {editingCategory ? 'Editar' : 'Nueva categoria'}
            </p>
            <h2>{editingCategory ? editingCategory.name : 'Categoria'}</h2>
          </div>

          <FormField label="Nombre">
            <input
              disabled={submitting}
              onChange={(event) => updateForm('name', event.target.value)}
              required
              type="text"
              value={formValues.name}
            />
          </FormField>

          <FormField label="Orden">
            <input
              disabled={submitting}
              min="0"
              onChange={(event) => updateForm('sortOrder', event.target.value)}
              step="1"
              type="number"
              value={formValues.sortOrder}
            />
          </FormField>

          <FormField label="Descripcion">
            <textarea
              disabled={submitting}
              onChange={(event) =>
                updateForm('description', event.target.value)
              }
              rows={4}
              value={formValues.description}
            />
          </FormField>

          <label className="checkbox-field">
            <input
              checked={formValues.isActive}
              disabled={submitting}
              onChange={(event) => updateForm('isActive', event.target.checked)}
              type="checkbox"
            />
            <span>Categoria activa</span>
          </label>

          <div className="form-actions-row">
            <button className="primary-button" disabled={submitting} type="submit">
              <FolderPlus aria-hidden="true" size={18} />
              {editingCategory ? 'Guardar cambios' : 'Crear categoria'}
            </button>
            {editingCategory ? (
              <button
                className="secondary-link"
                disabled={submitting}
                onClick={resetForm}
                type="button"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <section className="category-list">
          {loading ? (
            <div className="admin-table-skeleton">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {!loading && categories.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title="No hay categorias"
              description="Crea la primera categoria para clasificar productos."
            />
          ) : null}

          {!loading && categories.length > 0 ? (
            <div className="category-list-grid">
              {categories.map((category) => (
                <article
                  className={
                    category.isActive ? 'category-card' : 'category-card muted'
                  }
                  key={category.id}
                >
                  <div>
                    <strong>{category.name}</strong>
                    <span>Orden {category.sortOrder}</span>
                    {category.description ? <p>{category.description}</p> : null}
                  </div>
                  <div className="category-card-actions">
                    <button
                      aria-label={`Editar ${category.name}`}
                      onClick={() => startEdit(category)}
                      title="Editar"
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={
                        category.isActive
                          ? `Desactivar ${category.name}`
                          : `Activar ${category.name}`
                      }
                      onClick={() => toggleCategory(category)}
                      title={category.isActive ? 'Desactivar' : 'Activar'}
                      type="button"
                    >
                      <Power aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Eliminar ${category.name}`}
                      onClick={() => setConfirmCategory(category)}
                      title="Eliminar"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>

      <ConfirmDialog
        confirmLabel="Eliminar"
        danger
        description="Los productos asociados quedaran sin categoria por la regla existente de la base de datos."
        loading={submitting}
        onCancel={() => setConfirmCategory(null)}
        onConfirm={confirmDelete}
        open={Boolean(confirmCategory)}
        title={
          confirmCategory ? `Eliminar categoria ${confirmCategory.name}` : ''
        }
      />
    </main>
  )
}
