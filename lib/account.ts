import { createClient } from '@/lib/supabase/client'
import { type Subscription, type SubscriptionStatus } from '@/lib/subscription'

type SubRow = {
  user_id: string
  status: string
  utr: string | null
  amount: number | null
  plan_months: number
  plan_key?: string | null
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
    planKey: row.plan_key ?? null,
    submittedAt: row.submitted_at,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  }
}

/** The current user's subscription row, or null if they've never submitted one. */
export async function getMySubscription(): Promise<Subscription | null> {
  const { data: userData, error: authError } = await createClient().auth.getUser()
  if (authError) throw authError
  const uid = userData.user?.id
  if (!uid) return null
  const { data, error } = await createClient()
    .from('subscriptions')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data as SubRow) : null
}

// ── Profile ──────────────────────────────────────────────────────────────────

/** Editable business fields — these pre-fill the "From" side of a new invoice. */
export interface ProfileInput {
  fullName: string
  phone: string
  companyName: string
  address: string
  gstin: string
  stateName: string
  stateCode: string
  pan: string
  bankAccountName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  bankBranch: string
  jurisdiction: string
  defaultInvoiceNotes: string
}

export interface Profile extends ProfileInput {
  id: string
  email: string
  createdAt: string | null
}

type ProfileRow = {
  id: string
  full_name: string
  phone: string
  company_name: string
  email: string
  created_at: string | null
  address: string
  gstin: string
  state_name: string
  state_code: string
  pan: string
  bank_account_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
  bank_branch: string
  jurisdiction: string
  default_invoice_notes: string
}

const PROFILE_COLUMNS =
  'id, full_name, phone, company_name, email, created_at, address, gstin, state_name, state_code, pan, bank_account_name, bank_name, account_number, ifsc_code, bank_branch, jurisdiction, default_invoice_notes'

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return null

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()
  let data = profileData

  if ((error || !data) && user) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      ''
    const phone = user.user_metadata?.phone || ''
    const companyName = user.user_metadata?.company_name || ''

    const { data: createdData, error: createError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: fullName,
          phone: phone,
          company_name: companyName,
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_COLUMNS)
      .maybeSingle()

    if (createError) throw createError
    data = createdData
  }

  if (error && !data) throw error
  if (!data) return null
  const row = data as ProfileRow
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    companyName: row.company_name,
    email: row.email,
    createdAt: row.created_at,
    address: row.address ?? '',
    gstin: row.gstin ?? '',
    stateName: row.state_name ?? '',
    stateCode: row.state_code ?? '',
    pan: row.pan ?? '',
    bankAccountName: row.bank_account_name ?? '',
    bankName: row.bank_name ?? '',
    accountNumber: row.account_number ?? '',
    ifscCode: row.ifsc_code ?? '',
    bankBranch: row.bank_branch ?? '',
    jurisdiction: row.jurisdiction ?? '',
    defaultInvoiceNotes: row.default_invoice_notes ?? '',
  }
}

export async function updateMyProfile(input: ProfileInput): Promise<void> {
  const { data: userData } = await createClient().auth.getUser()
  const user = userData.user
  if (!user) throw new Error('Not authenticated')
  // Upsert so it also works for any legacy account missing a profile row.
  const { error } = await createClient()
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        company_name: input.companyName.trim(),
        address: input.address.trim(),
        gstin: input.gstin.trim(),
        state_name: input.stateName.trim(),
        state_code: input.stateCode.trim(),
        pan: input.pan.trim(),
        bank_account_name: input.bankAccountName.trim(),
        bank_name: input.bankName.trim(),
        account_number: input.accountNumber.trim(),
        ifsc_code: input.ifscCode.trim(),
        bank_branch: input.bankBranch.trim(),
        jurisdiction: input.jurisdiction.trim(),
        default_invoice_notes: input.defaultInvoiceNotes.trim(),
      },
      { onConflict: 'id' },
    )
  if (error) throw error
}

