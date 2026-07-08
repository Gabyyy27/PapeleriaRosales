import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { toast } from '../../lib/toasts'
import { adminPaths } from '../../routes/paths'

function getSafeRedirectPath(search) {
  const redirectTo = new URLSearchParams(search).get('redirectTo')

  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return adminPaths.root
  }

  return redirectTo
}

export function LoginPage() {
  const { loading, session, signInWithPassword } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectPath = getSafeRedirectPath(location.search)

  if (!loading && session) {
    return <Navigate to={redirectPath} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)

    const { error } = await signInWithPassword({
      email,
      password,
    })

    setSubmitting(false)

    if (error) {
      toast.error('No se pudo iniciar sesion', error.message)
      return
    }

    toast.success('Sesion iniciada')
    navigate(redirectPath, { replace: true })
  }

  return (
    <main className="page-section auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Acceso administrativo</p>
        <h1>Iniciar sesion</h1>
        <p>Usa una cuenta registrada en Supabase Auth para entrar.</p>

        <label>
          Correo
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Contrasena
          <input
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
