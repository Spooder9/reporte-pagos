export function calculateMonthlyPayment(amount: number, annualRate: number, months: number): number {
  if (annualRate === 0) return Math.round((amount / months) * 100) / 100
  const r = annualRate / 100 / 12
  const payment = amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  return Math.round(payment * 100) / 100
}

export function calculateTotalInterest(monthlyPayment: number, months: number, principal: number): number {
  return Math.round((monthlyPayment * months - principal) * 100) / 100
}

export function calculateTotalAmount(monthlyPayment: number, months: number): number {
  return Math.round(monthlyPayment * months * 100) / 100
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
