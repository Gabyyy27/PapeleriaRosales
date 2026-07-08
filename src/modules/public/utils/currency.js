const currencyFormatter = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
  minimumFractionDigits: 2,
})

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}
