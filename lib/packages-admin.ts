import { createClient } from '@/lib/supabase/client'
import { PACKAGE_COLUMNS, rowToPackage, type Package, type PackageRow } from '@/lib/packages'

// Browser-client package access. Reads of active packages are allowed for any
// authenticated user (used by the subscribe plan-picker); writes are gated by
// the "Admins manage packages" RLS policy.

/** Active packages only — for the subscribe plan-picker. */
export async function listActivePackages(): Promise<Package[]> {
  const { data, error } = await createClient()
    .from('packages')
    .select(PACKAGE_COLUMNS)
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data as PackageRow[] | null)?.map(rowToPackage) ?? []
}
