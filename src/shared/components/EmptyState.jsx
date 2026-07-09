import { PackageOpen } from 'lucide-react'

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  tone = 'default',
}) {
  return (
    <div className={`empty-state empty-state-${tone}`}>
      <Icon aria-hidden="true" size={38} />
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}
