import { LogOut } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { toast } from '../lib/toasts'
import { publicPaths } from '../routes/paths'

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

        <button className="icon-button" type="button" onClick={handleSignOut}>
          <LogOut size={18} aria-hidden="true" />
          <span>Cerrar sesion</span>
        </button>
      </header>

      <Outlet />
    </div>
  )
}
