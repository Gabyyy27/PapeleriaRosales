import { Link } from 'react-router-dom'
import { publicPaths } from '../../routes/paths'

export function HomePage() {
  return (
    <main className="page-section hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Papeleria Rosales</p>
        <h1>Base digital para venta, catalogo e inventario.</h1>
        <p>
          Esta primera fase deja lista la estructura del proyecto, autenticacion
          administrativa y rutas base para crecer por modulos.
        </p>
        <div className="actions">
          <Link className="primary-link" to={publicPaths.catalog}>
            Ver catalogo
          </Link>
          <Link className="secondary-link" to={publicPaths.services}>
            Ver servicios
          </Link>
        </div>
      </div>
    </main>
  )
}
