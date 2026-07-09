import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from '../../../lib/toasts'
import { FormField } from '../../../shared/components/FormField'
import { MAX_PRODUCT_IMAGES } from '../services/productImages.service'
import { CategorySelect } from './CategorySelect'
import { ProductImageUploader } from './ProductImageUploader'

const DEFAULT_VALUES = {
  name: '',
  description: '',
  categoryId: '',
  sku: '',
  barcode: '',
  stock: '0',
  minStock: '0',
  unitCost: '0',
  salePrice: '',
  status: 'active',
  visiblePublic: true,
}

function toExistingImageItem(image) {
  return {
    id: image.id,
    kind: 'existing',
    storageBucket: image.storageBucket,
    storagePath: image.storagePath,
    publicUrl: image.publicUrl,
    altText: image.altText,
  }
}

function getInitialValues(product) {
  if (!product) {
    return DEFAULT_VALUES
  }

  return {
    name: product.name ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId ?? '',
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    stock: String(product.stock ?? 0),
    minStock: String(product.minStock ?? 0),
    unitCost: String(product.unitCost ?? 0),
    salePrice: String(product.salePrice ?? ''),
    status: product.status ?? 'active',
    visiblePublic: Boolean(product.visiblePublic),
  }
}

function isNonNegative(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

function validateProduct(values, images) {
  const errors = {}

  if (!values.name.trim()) {
    errors.name = 'El nombre es requerido.'
  }

  if (values.salePrice === '' || !isNonNegative(values.salePrice)) {
    errors.salePrice = 'El precio final debe ser mayor o igual a 0.'
  }

  if (!isNonNegative(values.unitCost || 0)) {
    errors.unitCost = 'El costo debe ser mayor o igual a 0.'
  }

  if (!isNonNegative(values.stock)) {
    errors.stock = 'El stock debe ser mayor o igual a 0.'
  }

  if (!isNonNegative(values.minStock)) {
    errors.minStock = 'El stock minimo debe ser mayor o igual a 0.'
  }

  if (images.length > MAX_PRODUCT_IMAGES) {
    errors.images = `Maximo ${MAX_PRODUCT_IMAGES} imagenes por producto.`
  }

  return errors
}

export function ProductForm({
  mode,
  product,
  categories,
  submitting,
  onSubmit,
}) {
  const initialImages = useMemo(() => product?.images ?? [], [product])
  const [values, setValues] = useState(() => getInitialValues(product))
  const [images, setImages] = useState(() =>
    initialImages.map(toExistingImageItem),
  )
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setValues(getInitialValues(product))
    setImages((product?.images ?? []).map(toExistingImageItem))
    setErrors({})
  }, [product])

  function updateValue(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
    setErrors((current) => ({
      ...current,
      [field]: '',
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateProduct(values, images)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Revisa el formulario', 'Hay campos obligatorios o invalidos.')
      return
    }

    onSubmit({
      values: {
        ...values,
        unitCost: values.unitCost || 0,
      },
      imageItems: images,
      previousImages: initialImages,
    })
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <section className="product-form-section product-form-main">
        <div className="section-heading">
          <p className="eyebrow">
            {mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
          </p>
          <h2>Datos del producto</h2>
        </div>

        <div className="form-grid">
          <FormField label="Nombre" error={errors.name}>
            <input
              autoComplete="off"
              disabled={submitting}
              onChange={(event) => updateValue('name', event.target.value)}
              required
              type="text"
              value={values.name}
            />
          </FormField>

          <FormField label="Categoria">
            <CategorySelect
              categories={categories}
              disabled={submitting}
              onChange={(value) => updateValue('categoryId', value)}
              value={values.categoryId}
            />
          </FormField>

          <FormField label="SKU">
            <input
              autoComplete="off"
              disabled={submitting}
              onChange={(event) => updateValue('sku', event.target.value)}
              type="text"
              value={values.sku}
            />
          </FormField>

          <FormField label="Codigo de barras">
            <input
              autoComplete="off"
              disabled={submitting}
              onChange={(event) => updateValue('barcode', event.target.value)}
              type="text"
              value={values.barcode}
            />
          </FormField>

          <FormField label="Stock" error={errors.stock}>
            <input
              disabled={submitting}
              min="0"
              onChange={(event) => updateValue('stock', event.target.value)}
              step="1"
              type="number"
              value={values.stock}
            />
          </FormField>

          <FormField label="Stock minimo" error={errors.minStock}>
            <input
              disabled={submitting}
              min="0"
              onChange={(event) => updateValue('minStock', event.target.value)}
              step="1"
              type="number"
              value={values.minStock}
            />
          </FormField>

          <FormField label="Costo" error={errors.unitCost}>
            <input
              disabled={submitting}
              min="0"
              onChange={(event) => updateValue('unitCost', event.target.value)}
              step="0.01"
              type="number"
              value={values.unitCost}
            />
          </FormField>

          <FormField label="Precio final" error={errors.salePrice}>
            <input
              disabled={submitting}
              min="0"
              onChange={(event) => updateValue('salePrice', event.target.value)}
              required
              step="0.01"
              type="number"
              value={values.salePrice}
            />
          </FormField>

          <FormField label="Estado">
            <select
              disabled={submitting}
              onChange={(event) => updateValue('status', event.target.value)}
              value={values.status}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="archived">Archivado</option>
            </select>
          </FormField>

          <label className="checkbox-field">
            <input
              checked={values.visiblePublic}
              disabled={submitting}
              onChange={(event) =>
                updateValue('visiblePublic', event.target.checked)
              }
              type="checkbox"
            />
            <span>Visible en catalogo publico</span>
          </label>

          <FormField className="form-field-wide" label="Descripcion">
            <textarea
              disabled={submitting}
              onChange={(event) =>
                updateValue('description', event.target.value)
              }
              rows={5}
              value={values.description}
            />
          </FormField>
        </div>
      </section>

      <section className="product-form-section">
        <div className="section-heading">
          <p className="eyebrow">Galeria</p>
          <h2>Imagenes del producto</h2>
        </div>
        <ProductImageUploader
          disabled={submitting}
          images={images}
          onChange={setImages}
        />
        {errors.images ? (
          <p className="form-error-text" role="alert">
            {errors.images}
          </p>
        ) : null}
      </section>

      <div className="sticky-form-actions">
        <button className="primary-button" disabled={submitting} type="submit">
          <Save aria-hidden="true" size={18} />
          {submitting ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </form>
  )
}
