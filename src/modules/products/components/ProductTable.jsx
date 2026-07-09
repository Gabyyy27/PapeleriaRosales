import { Archive, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductImage } from '../../public/components/ProductImage'
import { formatCurrency } from '../../public/utils/currency'
import { ProductStatusBadge } from './ProductStatusBadge'

const SKELETON_ROWS = Array.from({ length: 5 }, (_, index) => index)

export function ProductTable({
  products,
  loading,
  getEditPath,
  onArchive,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="admin-table-card">
        <div className="admin-table-skeleton">
          {SKELETON_ROWS.map((row) => (
            <span key={row} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="admin-table-card">
      <table className="product-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Catalogo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const lowStock =
              product.minStock > 0 && product.stock <= product.minStock

            return (
              <tr className={lowStock ? 'low-stock-row' : ''} key={product.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-cell-image">
                      <ProductImage
                        alt={product.name}
                        loading="lazy"
                        src={product.primaryImage?.publicUrl}
                      />
                    </div>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.categoryName || 'Sin categoria'}</span>
                      <small>
                        {product.sku ? `SKU ${product.sku}` : 'Sin SKU'}
                        {product.barcode ? ` · ${product.barcode}` : ''}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={lowStock ? 'stock-warning' : ''}>
                    {product.stock}
                  </span>
                  <small>Min. {product.minStock}</small>
                </td>
                <td>
                  <strong>{formatCurrency(product.salePrice)}</strong>
                </td>
                <td>
                  <ProductStatusBadge status={product.status} />
                </td>
                <td>
                  <span
                    className={
                      product.visiblePublic
                        ? 'catalog-visibility-on'
                        : 'catalog-visibility-off'
                    }
                  >
                    {product.visiblePublic ? 'Visible' : 'Oculto'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link
                      aria-label={`Editar ${product.name}`}
                      className="table-action-button"
                      title="Ver o editar"
                      to={getEditPath(product.id)}
                    >
                      <Pencil aria-hidden="true" size={16} />
                    </Link>
                    <button
                      aria-label={`Archivar ${product.name}`}
                      className="table-action-button"
                      disabled={product.status === 'archived'}
                      onClick={() => onArchive(product)}
                      title="Archivar"
                      type="button"
                    >
                      <Archive aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Eliminar ${product.name}`}
                      className="table-action-button table-action-danger"
                      onClick={() => onDelete(product)}
                      title="Eliminar"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
