import { createClient } from '@/lib/supabase/server'
import { PACKAGE_COLUMNS, rowToPackage, type Package, type PackageRow } from '@/lib/packages'

// Server-side read for the public landing page. Only active packages, ordered
// for display. Degrades to empty on any error (e.g. migration not applied yet).
export async function listActivePackages(): Promise<Package[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('packages')
    .select(PACKAGE_COLUMNS)
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error || !data) return []
  return (data as PackageRow[]).map(rowToPackage)
}
