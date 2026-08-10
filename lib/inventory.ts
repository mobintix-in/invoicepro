import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  description: string
  hsnCode: string
  unit: string
  quantity: number
  reorderLevel: number
  unitPrice: number
  gstRate: number
  createdAt: string
  updatedAt: string
}

export interface InventoryItemInput {
  id?: string
  name: string
  sku: string
  description: string
  hsnCode: string
  unit: string
  quantity: number
  reorderLevel: number
  unitPrice: number
  gstRate: number
}

type InventoryRow = {
  id: string
  user_id: string
  name: string
  sku: string
  description: string
  hsn_code: string
  unit: string
  quantity: number
  reorder_level: number
  unit_price: number
  gst_rate: number
  created_at: string
  updated_at: string
}

function fromRow(r: InventoryRow): InventoryItem {
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    description: r.description,
    hsnCode: r.hsn_code,
    unit: r.unit,
    quantity: Number(r.quantity) || 0,
    reorderLevel: Number(r.reorder_level) || 0,
    unitPrice: Number(r.unit_price) || 0,
    gstRate: Number(r.gst_rate) || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

async function getUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user.id
}

/** True when stock has fallen to or below the item's reorder level. */
export function isLowStock(item: InventoryItem): boolean {
  return item.reorderLevel > 0 && item.quantity <= item.reorderLevel
}

export async function listInventory(): Promise<InventoryItem[]> {
  const { data, error } = await createClient()
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data as InventoryRow[] | null)?.map(fromRow) ?? []
}

export async function saveInventoryItem(input: InventoryItemInput): Promise<void> {
  const userId = await getUserId()
  const { error } = await createClient()
    .from('inventory_items')
    .upsert(
      {
        id: input.id ?? generateId(),
        user_id: userId,
        name: input.name.trim(),
        sku: input.sku.trim(),
        description: input.description.trim(),
        hsn_code: input.hsnCode.trim(),
        unit: input.unit.trim(),
        quantity: input.quantity,
        reorder_level: input.reorderLevel,
        unit_price: input.unitPrice,
        gst_rate: input.gstRate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
  if (error) throw error
}

/**
 * Adjust an item's stock on hand by a signed delta (e.g. +5 to receive stock,
 * -1 to record a sale). Never drops below zero. Returns the new quantity.
 */
export async function adjustStock(id: string, delta: number): Promise<number> {
  const { data, error } = await createClient().rpc('adjust_inventory_stock', {
    p_id: id,
    p_delta: delta,
  })
  if (error) throw error
  const quantity = Number(data)
  if (!Number.isFinite(quantity)) throw new Error('Could not update stock')
  return quantity
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await createClient().from('inventory_items').delete().eq('id', id)
  if (error) throw error
}
