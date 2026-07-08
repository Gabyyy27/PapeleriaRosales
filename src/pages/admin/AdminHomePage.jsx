export function AdminHomePage() {
  return (
    <main className="admin-content">
      <section className="admin-panel">
        <p className="eyebrow">Fase 1</p>
        <h2>Ruta administrativa protegida</h2>
        <p>
          La sesion de Supabase Auth ya protege esta area. Los modulos de POS,
          productos, inventario, dashboard y servicios se conectaran por fases.
        </p>
      </section>
    </main>
  )
}
