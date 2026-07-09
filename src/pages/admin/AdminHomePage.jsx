import { ArrowRight, Boxes, FolderTree } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminPaths } from '../../routes/paths'

export function AdminHomePage() {
  return (
    <main className="admin-content">
      <section className="admin-panel admin-home-panel">
        <p className="eyebrow">Administracion</p>
        <h2>Modulo de productos listo</h2>
        <p>
          La sesion de Supabase Auth protege esta area. Desde aqui puedes
          administrar productos, categorias, costos internos e imagenes.
        </p>
        <div className="admin-home-actions">
          <Link className="primary-link" to={adminPaths.products}>
            <Boxes aria-hidden="true" size={18} />
            Productos
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
          <Link className="secondary-link" to={adminPaths.categories}>
            <FolderTree aria-hidden="true" size={18} />
            Categorias
          </Link>
        </div>
      </section>
    </main>
  )
}
