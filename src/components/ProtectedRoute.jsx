import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getLoginPath } from '../routes/paths'

export function ProtectedRoute({ children }) {
  const { loading, session } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="auth-state">
        <p>Validando sesion...</p>
      </main>
    )
  }

  if (!session) {
    return (
      <Navigate
        to={getLoginPath(`${location.pathname}${location.search}`)}
        replace
      />
    )
  }

  return children
}
