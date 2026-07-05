import { createClient } from '@/lib/supabase/client'
import { SUBSCRIPTION, type Subscription, type SubscriptionStatus } from '@/lib/subscription'

type SubRow = {
  user_id: string
  status: string
  utr: string | null
  amount: number | null
  plan_months: number
  submitted_at: string | null
  activated_at: string | null
  expires_at: string | null
  updated_at: string | null
}

function fromRow(row: SubRow): Subscription {
  return {
    userId: row.user_id,
    status: row.status as SubscriptionStatus,
    utr: row.utr,
    amount: row.amount === null ? null : Number(row.amount),
    planMonths: row.plan_months,
    submittedAt: row.submitted_at,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  }
}

/** Access flags for the current user, computed server-side via the my_access() RPC. */
export async function getMyAccess(): Promise<{ isAdmin: boolean; isActive: boolean }> {
  const { data, error } = await createClient().rpc('my_access').single<{ is_admin: boolean; is_active: boolean }>()
  if (error || !data) return { isAdmin: false, isActive: false }
  return { isAdmin: !!data.is_admin, isActive: !!data.is_active }
}

/** The current user's subscription row, or null if they've never submitted one. */
export async function getMySubscription(): Promise<Subscription | null> {
  const { data: userData } = await createClient().auth.getUser()
  const uid = userData.user?.id
  if (!uid) return null
  const { data, error } = await createClient()
    .from('subscriptions')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle()
  if (error || !data) return null
  return fromRow(data as SubRow)
}

/**
 * Records a payment attempt for manual review. Creates the row as 'pending'
 * (or flips a previously rejected/expired row back to 'pending').
 */
export async function submitPayment(utr: string): Promise<void> {
  const { data: userData } = await createClient().auth.getUser()
  const uid = userData.user?.id
  if (!uid) throw new Error('Not authenticated')

  const existing = await getMySubscription()
  const supabase = createClient()

  if (existing && (existing.status === 'rejected' || existing.status === 'expired')) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'pending',
        utr: utr.trim(),
        amount: SUBSCRIPTION.priceInr,
        submitted_at: new Date().toISOString(),
        activated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('subscriptions').insert({
    user_id: uid,
    status: 'pending',
    utr: utr.trim(),
    amount: SUBSCRIPTION.priceInr,
    plan_months: SUBSCRIPTION.planMonths,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

// ── Admin ───────────────────────────────────────────────────────────────────

export interface PendingSubscription extends Subscription {
  profile: { fullName: string; companyName: string; email: string; phone: string } | null
}

export async function listPendingSubscriptions(): Promise<PendingSubscription[]> {
  const { data, error } = await createClient()
    .from('subscriptions')
    .select('*, profiles(full_name, company_name, email, phone)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  if (error || !data) return []
  return (data as (SubRow & { profiles: { full_name: string; company_name: string; email: string; phone: string } | null })[]).map(row => ({
    ...fromRow(row),
    profile: row.profiles
      ? {
          fullName: row.profiles.full_name,
          companyName: row.profiles.company_name,
          email: row.profiles.email,
          phone: row.profiles.phone,
        }
      : null,
  }))
}

export async function approveSubscription(userId: string, planMonths = SUBSCRIPTION.planMonths): Promise<void> {
  const now = new Date()
  const expires = new Date(now)
  expires.setMonth(expires.getMonth() + planMonths)
  const { error } = await createClient()
    .from('subscriptions')
    .update({
      status: 'active',
      activated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      plan_months: planMonths,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId)
  if (error) throw error
}

export async function rejectSubscription(userId: string): Promise<void> {
  const { error } = await createClient()
    .from('subscriptions')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw error
}

// ── All users (admin roster) ─────────────────────────────────────────────────

export interface UserRow {
  userId: string
  fullName: string
  companyName: string
  email: string
  phone: string
  createdAt: string | null
  status: SubscriptionStatus | 'none'
  utr: string | null
  amount: number | null
  submittedAt: string | null
  expiresAt: string | null
}

type ProfileWithSub = {
  id: string
  full_name: string
  company_name: string
  email: string
  phone: string
  created_at: string | null
  subscriptions: SubRow | SubRow[] | null
}

/** Every registered user with their (optional) subscription — admins only, via RLS. */
export async function listAllUsers(): Promise<UserRow[]> {
  const { data, error } = await createClient()
    .from('profiles')
    .select('id, full_name, company_name, email, phone, created_at, subscriptions(status, utr, amount, submitted_at, expires_at)')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as ProfileWithSub[]).map((row) => {
    const sub = Array.isArray(row.subscriptions) ? row.subscriptions[0] : row.subscriptions
    return {
      userId: row.id,
      fullName: row.full_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      createdAt: row.created_at,
      status: (sub?.status as SubscriptionStatus | undefined) ?? 'none',
      utr: sub?.utr ?? null,
      amount: sub?.amount != null ? Number(sub.amount) : null,
      submittedAt: sub?.submitted_at ?? null,
      expiresAt: sub?.expires_at ?? null,
    }
  })
}

/** Grant/renew an active subscription for a user (works even if they have no row yet). */
export async function grantSubscription(userId: string, planMonths = SUBSCRIPTION.planMonths): Promise<void> {
  const now = new Date()
  const expires = new Date(now)
  expires.setMonth(expires.getMonth() + planMonths)
  const { error } = await createClient()
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        status: 'active',
        activated_at: now.toISOString(),
        expires_at: expires.toISOString(),
        plan_months: planMonths,
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' },
    )
  if (error) throw error
}

/** Immediately end a user's access. */
export async function revokeSubscription(userId: string): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await createClient()
    .from('subscriptions')
    .update({ status: 'expired', expires_at: now, updated_at: now })
    .eq('user_id', userId)
  if (error) throw error
}
