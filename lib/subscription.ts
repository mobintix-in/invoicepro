// ────────────────────────────────────────────────────────────────────────────
// Subscription / payment configuration.
//
// TODO: replace these three values with your real details before going live.
//   • upiId     – the UPI ID money should be paid to (shown in the QR)
//   • payeeName – the name your UPI app will display to the payer
//   • priceInr  – the monthly subscription price, in ₹
// ────────────────────────────────────────────────────────────────────────────

export const SUBSCRIPTION = {
  upiId: 'your-upi-id@bank', // e.g. 'aryanbhimani@okhdfcbank'
  payeeName: 'InvoicePro',
  priceInr: 199,
  planMonths: 1,
} as const

/**
 * Builds a UPI deep-link / QR payload (`upi://pay?...`) that any UPI app
 * (GPay, PhonePe, Paytm, BHIM…) can open or scan to pay the fixed amount.
 */
export function upiPaymentUri(note = 'InvoicePro Monthly Subscription'): string {
  const params = new URLSearchParams({
    pa: SUBSCRIPTION.upiId,
    pn: SUBSCRIPTION.payeeName,
    am: String(SUBSCRIPTION.priceInr),
    cu: 'INR',
    tn: note,
  })
  return `upi://pay?${params.toString()}`
}

export type SubscriptionStatus = 'none' | 'pending' | 'active' | 'rejected' | 'expired'

export interface Subscription {
  userId: string
  status: SubscriptionStatus
  utr: string | null
  amount: number | null
  planMonths: number
  submittedAt: string | null
  activatedAt: string | null
  expiresAt: string | null
  updatedAt: string | null
}

/** True when the subscription grants access right now. */
export function isSubscriptionActive(sub: Pick<Subscription, 'status' | 'expiresAt'> | null): boolean {
  if (!sub || sub.status !== 'active' || !sub.expiresAt) return false
  return new Date(sub.expiresAt).getTime() > Date.now()
}
