export function FormField({ label, error, children, hint, className = '' }) {
  return (
    <label className={`form-field ${className}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  )
}
