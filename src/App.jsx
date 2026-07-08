import { Toaster } from 'sileo'
import { AuthProvider } from './auth/AuthProvider'
import { AppRouter } from './routes/AppRouter'

function App() {
  return (
    <AuthProvider>
      <Toaster
        offset={16}
        options={{ duration: 3500, roundness: 8 }}
        position="top-right"
        theme="system"
      />
      <AppRouter />
    </AuthProvider>
  )
}

export default App
