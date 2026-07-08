import { Link } from 'react-router-dom'
import { publicPaths } from '../../routes/paths'

export function NotFoundPage() {
  return (
    <main className="page-section">
      <p className="eyebrow">404</p>
      <h1>Ruta no encontrada</h1>
      <p>La pagina solicitada no existe o fue movida.</p>
      <Link className="primary-link compact" to={publicPaths.home}>
        Volver al inicio
      </Link>
    </main>
  )
}
