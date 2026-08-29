// Pure, isomorphic package (plan) types and helpers — no Supabase import, so
// Pure, isomorphic package (plan) types and helpers — no Supabase import, so
// this is safe in both server components (welcome page) and client components
// (subscribe page, admin editor).
//
//   • Public reads → lib/packages-server.ts (server client)
//   • Client reads + admin CRUD → lib/packages-admin.ts (browser client)

export type Package = {
  id: string
  key: string
  name: string
  priceInr: number
  durationMonths: number
  tagline: string
  features: string[]
  invoiceLimit: number | null // null = unlimited (per month)
  cta: string
  highlighted: boolean
  sortOrder: number
  active: boolean
}

export type PackageRow = {
  id: string
  key: string
  name: string
  price_inr: number
  duration_months?: number | null
  tagline: string
  features: unknown
  invoice_limit: number | null
  cta: string
  highlighted: boolean
  sort_order: number
  active: boolean
}

export const PACKAGE_COLUMNS =
  'id, key, name, price_inr, duration_months, tagline, features, invoice_limit, cta, highlighted, sort_order, active'

function toFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
  return []
}

export function rowToPackage(row: PackageRow): Package {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    priceInr: Number(row.price_inr),
    durationMonths: Math.max(1, Number(row.duration_months) || 1),
    tagline: row.tagline,
    features: toFeatures(row.features),
    invoiceLimit: row.invoice_limit === null ? null : Number(row.invoice_limit),
    cta: row.cta,
    highlighted: row.highlighted,
    sortOrder: row.sort_order,
    active: row.active,
  }
}

export function formatDuration(months: number): string {
  if (months === 1) return '1 month'
  if (months === 6) return '6 months'
  if (months === 12) return '1 year'
  if (months % 12 === 0) return `${months / 12} years`
  return `${months} months`
}

export function formatBillingCycle(months: number): string {
  if (months === 1) return '/ month'
  if (months === 6) return '/ 6 months'
  if (months === 12) return '/ year'
  if (months % 12 === 0) return `/ ${months / 12} years`
  return `/ ${months} mos`
}

export function getMonthlyEquivalent(priceInr: number, months: number): number {
  if (months <= 1) return priceInr
  return Math.round(priceInr / months)
}
