import { useEffect, useState } from 'react'
import { getCurrentOrganization } from '../services/organization.service'

export function useAdminOrganization() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    organization: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    setState({
      loading: true,
      error: null,
      organization: null,
    })

    getCurrentOrganization({ signal: controller.signal })
      .then((organization) => {
        setState({
          loading: false,
          error: null,
          organization,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return
        }

        setState({
          loading: false,
          error,
          organization: null,
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
