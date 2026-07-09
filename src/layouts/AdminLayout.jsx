import { Boxes, FolderTree, Home, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { toast } from '../lib/toasts'
import { adminPaths, publicPaths } from '../routes/paths'

export function AdminLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    const { error } = await signOut()

    if (error) {
      toast.error('No se pudo cerrar sesion', error.message)
      return
    }

    toast.info('Sesion cerrada')
    navigate(publicPaths.login, { replace: true })
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administracion</p>
          <h1>Papeleria Rosales</h1>
          <p>{user?.email}</p>
        </div>

        <nav className="admin-nav" aria-label="Navegacion administrativa">
          <NavLink end to={adminPaths.root}>
            <Home aria-hidden="true" size={17} />
            Inicio
          </NavLink>
          <NavLink to={adminPaths.products}>
            <Boxes aria-hidden="true" size={17} />
            Productos
          </NavLink>
          <NavLink to={adminPaths.categories}>
            <FolderTree aria-hidden="true" size={17} />
            Categorias
          </NavLink>
        </nav>

        <button className="icon-button" type="button" onClick={handleSignOut}>
          <LogOut size={18} aria-hidden="true" />
          <span>Cerrar sesion</span>
        </button>
      </header>

      <Outlet />
    </div>
  )
}
