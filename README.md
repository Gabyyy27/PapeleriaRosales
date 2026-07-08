# Papeleria Rosales

Aplicacion web para Papeleria Rosales construida con React, Vite, Supabase,
React Router y Sileo.

## Estado actual

Fase 1 completada: base del proyecto, cliente Supabase, Supabase Auth en el
frontend, toasts, router, rutas publicas basicas y ruta administrativa protegida.

No se implementan todavia POS, productos, inventario, dashboard ni servicios
secretariales operativos.

## Estructura principal

```txt
src/
  auth/         Contexto y hooks de Supabase Auth
  components/  Componentes compartidos
  config/      Lectura y validacion de variables Vite
  layouts/     Layout publico y layout administrativo
  lib/         Clientes y utilidades externas
  pages/       Paginas publicas y administrativas
  routes/      Paths y configuracion de React Router
```

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```txt
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_ADMIN_ROUTE_SLUG=admin-private-slug
VITE_WHATSAPP_NUMBER=50400000000
```

- `VITE_SUPABASE_URL`: URL publica del proyecto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key para el cliente del navegador.
- `VITE_ADMIN_ROUTE_SLUG`: segmento privado de la ruta administrativa.
- `VITE_WHATSAPP_NUMBER`: numero publico para enlaces de WhatsApp en futuras fases.

No uses `service_role` ni llaves secretas en variables `VITE_*`.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Probar localmente

1. Configura `.env`.
2. Ejecuta `npm run dev`.
3. Abre la URL local que imprima Vite.
4. Revisa las rutas publicas:
   - `/`
   - `/catalogo`
   - `/servicios`
   - `/login`
5. Revisa la ruta admin usando el slug configurado:
   - `/${VITE_ADMIN_ROUTE_SLUG}`

Si no hay sesion de Supabase Auth, la ruta admin redirige a `/login`. Para
entrar, usa un usuario existente de Supabase Auth con email y contrasena.

## Supabase

El proyecto ya contiene migraciones en `supabase/migrations` para el modelo de
negocio futuro. En esta fase no se modificaron migraciones.

La configuracion frontend vive en:

- `src/config/env.js`
- `src/lib/supabaseClient.js`
- `src/auth/AuthProvider.jsx`
- `src/components/ProtectedRoute.jsx`

## Plan tecnico por fases

### Fase 1 - Base del proyecto

- Configuracion base del proyecto.
- Limpieza conservadora de la plantilla inicial.
- Cliente Supabase para el navegador.
- Variables de entorno documentadas.
- Sileo configurado para toasts.
- React Router configurado.
- Rutas publicas basicas.
- Ruta administrativa protegida con `VITE_ADMIN_ROUTE_SLUG`.
- `ProtectedRoute` usando Supabase Auth.
- README inicial actualizado.

### Fase 2 - Catalogo publico y productos

- Consultas publicas de categorias/productos desde Supabase.
- Vista de catalogo con busqueda y filtros.
- Manejo de imagenes publicas de productos.
- Estados vacios, errores y carga.

### Fase 3 - Administracion de productos

- CRUD administrativo de productos y categorias.
- Carga de imagenes al bucket `product-images`.
- Validaciones de formulario.
- Control de visibilidad publica y estado de producto.

### Fase 4 - Inventario

- Movimientos de inventario.
- Ajustes de stock.
- Alertas de stock minimo.
- Historial por producto.

### Fase 5 - POS

- Flujo de venta.
- Carrito.
- Registro transaccional con RPC `record_pos_sale`.
- Recibos y metodos de pago.

### Fase 6 - Servicios secretariales

- Catalogo interno de servicios.
- Registro de trabajos secretariales.
- Separacion contable de ventas de productos.

### Fase 7 - Dashboard y reportes

- Resumen de ventas.
- Reportes por dia/rango.
- Productos con bajo stock.
- Actividad reciente.

### Fase 8 - Seguridad, calidad y despliegue

- Reglas de rol en interfaz.
- Pruebas principales.
- Revision de RLS/storage.
- Configuracion final de Vercel y variables de produccion.
