import { Toaster } from 'sileo'
import { AuthProvider } from './auth/AuthProvider'
import { CartProvider } from './modules/public/cart/CartProvider'
import { AppRouter } from './routes/AppRouter'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster
          offset={16}
          options={{ duration: 3500, roundness: 8 }}
          position="top-right"
          theme="system"
        />
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
