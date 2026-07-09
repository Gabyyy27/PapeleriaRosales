export function CategorySelect({
  categories,
  value,
  onChange,
  disabled = false,
  includeEmpty = true,
}) {
  return (
    <select
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {includeEmpty ? <option value="">Sin categoria</option> : null}
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
          {category.isActive ? '' : ' (inactiva)'}
        </option>
      ))}
    </select>
  )
}
