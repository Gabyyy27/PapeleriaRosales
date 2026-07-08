import { NavLink, Outlet } from 'react-router-dom'
import { publicPaths } from '../routes/paths'

export function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to={publicPaths.home}>
          <span className="brand-mark" aria-hidden="true">
            PR
          </span>
          <span>
            <strong>Papeleria Rosales</strong>
            <small>Utiles, copias y servicios</small>
          </span>
        </NavLink>

        <nav className="site-nav" aria-label="Navegacion publica">
          <NavLink to={publicPaths.home}>Inicio</NavLink>
          <NavLink to={publicPaths.catalog}>Catalogo</NavLink>
          <NavLink to={publicPaths.services}>Servicios</NavLink>
        </nav>
      </header>

      <Outlet />
    </div>
  )
}
