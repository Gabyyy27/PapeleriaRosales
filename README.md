# Papeleria Rosales

Aplicacion web para Papeleria Rosales construida con React, Vite, Supabase,
React Router y Sileo.

## Estado actual

Fases 1 y 2 completadas:

- Base React/Vite, Supabase Auth, Sileo y React Router.
- Catalogo publico conectado a la vista `catalog_products`.
- Busqueda por nombre, filtro por categoria y paginacion real de 12 productos.
- Detalle de producto con galeria de hasta 5 imagenes.
- Carrito persistente en `localStorage`.
- Pedido preparado para WhatsApp mediante `VITE_WHATSAPP_NUMBER`.

No se implementan todavia POS, administracion de productos, inventario,
dashboard, compras pendientes ni servicios secretariales administrativos.

## Estructura principal

```txt
src/
  auth/         Contexto y hooks de Supabase Auth
  components/  Componentes compartidos
  config/      Lectura y validacion de variables Vite
  layouts/     Layout publico y layout administrativo
  lib/         Clientes y utilidades externas
  modules/
    public/
      cart/        Estado global del carrito
      components/  UI del catalogo y carrito
      services/    Consultas Supabase y logica de carrito/WhatsApp
      utils/       Formato de moneda
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
- `VITE_WHATSAPP_NUMBER`: numero de WhatsApp con codigo de pais, solo digitos.

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
   - `/catalogo/:slug-del-producto`
   - `/carrito`
   - `/servicios`
   - `/login`
5. Revisa la ruta admin usando el slug configurado:
   - `/${VITE_ADMIN_ROUTE_SLUG}`

Si no hay sesion de Supabase Auth, la ruta admin redirige a `/login`. Para
entrar, usa un usuario existente de Supabase Auth con email y contrasena.

### Probar la Fase 2

1. Confirma que Supabase tenga categorias activas y productos con
   `status = 'active'` y `visible_public = true`.
2. Abre `/catalogo` y verifica carga, busqueda y filtro por categoria.
3. Usa suficientes productos para comprobar que la URL cambia a
   `?pagina=2` y que Supabase devuelve solamente esa pagina.
4. Abre un producto y revisa su galeria. Con una sola imagen no deben aparecer
   flechas ni miniaturas.
5. Agrega productos, cambia cantidades y recarga el navegador. El carrito debe
   conservarse en `localStorage` bajo `papeleria-rosales:public-cart:v1`.
6. Abre `/carrito` y pulsa `Pedir por WhatsApp`. Debe abrir
   `wa.me/<VITE_WHATSAPP_NUMBER>` con productos, cantidades, subtotales y total
   estimado.

Los precios del mensaje son estimados. La disponibilidad y el total final se
confirman en WhatsApp.

### Datos de demostracion

Los datos demo estan separados por dominio y se ejecutan en este orden:

```txt
supabase/seeds/
  00_organization.sql
  10_catalog.sql
  20_secretarial_services.sql
  30_pending_purchases.sql
  40_sales.sql
  50_inventory.sql
```

`supabase/config.toml` usa `sql_paths = ["./seeds/*.sql"]`. Supabase ordena el
glob lexicograficamente, por eso cada archivo tiene un prefijo numerico.

Todos los seeds son idempotentes. El catalogo incluye 4 categorias y 15
productos para validar paginacion, busqueda, filtros, estados sin imagen y una
galeria de 3 imagenes. Los demas archivos preparan datos independientes para
servicios secretariales, compras pendientes, ventas e inventario.

Si ya inicializaste Supabase local y Docker esta activo, las migraciones y el
conjunto completo de seeds se aplican con:

```bash
npx supabase db reset
```

Para un proyecto remoto de pruebas puedes ejecutar los archivos en SQL Editor
siguiendo el orden numerico. No ejecutes estos seeds en produccion.

Para eliminar todos los datos demo, ejecuta en SQL Editor:

```txt
supabase/scripts/cleanup_demo.sql
```

## Supabase

El proyecto ya contiene migraciones en `supabase/migrations`. La Fase 2 utiliza
la vista existente `catalog_products`, las politicas RLS publicas y el bucket
publico `product-images`; no modifica migraciones.

El cliente del navegador usa exclusivamente
`VITE_SUPABASE_PUBLISHABLE_KEY`. No configures `service_role` en variables
`VITE_*`.

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

### Fase 2 - Catalogo publico y carrito WhatsApp

- Consultas paginadas sobre `catalog_products`.
- Busqueda por nombre y filtro por categoria.
- Cards, detalle y galeria publica de productos.
- Estados de carga, error, vacio y productos sin imagen.
- Carrito persistente con control de cantidades.
- Pedido ordenado mediante `wa.me`.

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
