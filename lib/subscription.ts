// ────────────────────────────────────────────────────────────────────────────
// Subscription / payment configuration.
//
// Shared direct-UPI recipient used by the website and Flutter application.
// ────────────────────────────────────────────────────────────────────────────

export const SUBSCRIPTION = {
  upiId: "9408962204@kotakbank",
  payeeName: "Mobintix Infotech",
  priceInr: 299,
  planMonths: 1,
} as const;

/**
 * Builds a UPI deep-link / QR payload (`upi://pay?...`) that any UPI app
 * (GPay, PhonePe, Paytm, BHIM…) can open or scan to pay the given amount.
 */
export function upiPaymentUri(
  amount: number = SUBSCRIPTION.priceInr,
  note = "InvoicePro Monthly Subscription",
  transactionReference?: string,
): string {
  const params = new URLSearchParams({
    pa: SUBSCRIPTION.upiId,
    pn: SUBSCRIPTION.payeeName,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  if (transactionReference) params.set("tr", transactionReference);
  return `upi://pay?${params.toString()}`;
}

export function createUpiPaymentReference(planKey: string): string {
  const safePlan = planKey
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 8);
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV${safePlan}${Date.now().toString(36).toUpperCase()}${random}`;
}

/** Android Chrome intent that opens Google Pay without an intermediary gateway. */
export function googlePayIntentUri(upiUri: string): string {
  const query = upiUri.includes("?")
    ? upiUri.slice(upiUri.indexOf("?") + 1)
    : "";
  return `intent://pay?${query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
}

export type SubscriptionStatus =
  | "none"
  | "pending"
  | "active"
  | "rejected"
  | "expired";

export interface Subscription {
  userId: string;
  status: SubscriptionStatus;
  utr: string | null;
  amount: number | null;
  planMonths: number;
  planKey: string | null;
  submittedAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
}

/** True when the subscription grants access right now. */
export function isSubscriptionActive(
  sub: Pick<Subscription, "status" | "expiresAt"> | null,
): boolean {
  if (!sub || sub.status !== "active" || !sub.expiresAt) return false;
  return new Date(sub.expiresAt).getTime() > Date.now();
}
