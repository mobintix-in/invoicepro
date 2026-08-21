const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function belowHundred(n: number): string {
  if (n < 20) return ones[n]
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
}

function belowThousand(n: number): string {
  if (n < 100) return belowHundred(n)
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + belowHundred(n % 100) : '')
}

function toWords(num: number): string {
  if (num === 0) return 'Zero'
  let n = Math.floor(num)
  let result = ''
  if (n >= 10000000) { result += belowThousand(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000 }
  if (n >= 100000)   { result += belowThousand(Math.floor(n / 100000))   + ' Lakh ';  n %= 100000  }
  if (n >= 1000)     { result += belowThousand(Math.floor(n / 1000))     + ' Thousand '; n %= 1000 }
  if (n > 0)           result += belowThousand(n)
  return result.trim()
}

export function roundMoney(amount: number): number {
  const num = Number(amount)
  if (!Number.isFinite(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export function amountToWords(amount: number): string {
  const num = Number(amount)
  const safeAmount = Number.isFinite(num) ? num : 0
  const totalPaise = Math.max(0, Math.round(safeAmount * 100))
  const whole = Math.floor(totalPaise / 100)
  const paise = totalPaise % 100
  let result = 'Indian Rupees ' + toWords(whole)
  if (paise > 0) result += ' and ' + toWords(paise) + ' Paise'
  return result + ' Only'
}

export function formatCurrency(amount: number): string {
  const num = Number(amount)
  const safeAmount = Number.isFinite(num) ? num : 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(safeAmount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString + 'T12:00:00'))
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function localDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function today(): string {
  return localDateString(new Date())
}

export function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return localDateString(date)
}
