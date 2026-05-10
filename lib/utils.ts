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

export function amountToWords(amount: number): string {
  const whole = Math.floor(amount)
  const paise = Math.round((amount - whole) * 100)
  let result = 'Indian Rupees ' + toWords(whole)
  if (paise > 0) result += ' and ' + toWords(paise) + ' Paise'
  return result + ' Only'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
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

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
