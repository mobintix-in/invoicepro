import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'

const CHALLAN_BUCKET = 'fabric-challans'
const MAX_CHALLAN_BYTES = 10 * 1024 * 1024
const ALLOWED_CHALLAN_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export type FabricStatus =
  | 'inward'
  | 'in_production'
  | 'completed'
  | 'dispatched'

export type FabricGrade = 'A' | 'B' | 'C' | 'rejected'

export interface FabricRoll {
  id: string
  rollNumber: string
  meters: number
  grade: FabricGrade
  shadeVariation: string
}

export interface FabricLot {
  id: string
  productionCompany: string
  partyName: string
  challanNumber: string
  challanDate: string
  lotNumber: string
  category: string
  quality: string
  shade: string
  variation: string
  construction: string
  widthInches: number | null
  gsm: number | null
  hsnCode: string
  ratePerMeter: number
  gstRate: number
  status: FabricStatus
  challanFilePath: string
  notes: string
  rolls: FabricRoll[]
  createdAt: string
  updatedAt: string
}

export interface FabricLotInput
  extends Omit<FabricLot, 'createdAt' | 'updatedAt'> {
  id: string
}

type FabricRollRow = {
  id: string
  roll_number: string
  meters: number | string
  grade: FabricGrade
  shade_variation: string
}

type FabricLotRow = {
  id: string
  production_company: string
  party_name: string
  challan_number: string
  challan_date: string | null
  lot_number: string
  category: string
  quality: string
  shade: string
  variation: string
  construction: string
  width_inches: number | string | null
  gsm: number | string | null
  hsn_code: string
  rate_per_meter: number | string
  gst_rate: number | string
  status: FabricStatus
  challan_file_path: string
  notes: string
  fabric_rolls: FabricRollRow[] | null
  created_at: string
  updated_at: string
}

function optionalNumber(value: number | string | null) {
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function fromRow(row: FabricLotRow): FabricLot {
  return {
    id: row.id,
    productionCompany: row.production_company,
    partyName: row.party_name,
    challanNumber: row.challan_number,
    challanDate: row.challan_date ?? '',
    lotNumber: row.lot_number,
    category: row.category,
    quality: row.quality,
    shade: row.shade,
    variation: row.variation,
    construction: row.construction,
    widthInches: optionalNumber(row.width_inches),
    gsm: optionalNumber(row.gsm),
    hsnCode: row.hsn_code,
    ratePerMeter: Number(row.rate_per_meter) || 0,
    gstRate: Number(row.gst_rate) || 0,
    status: row.status,
    challanFilePath: row.challan_file_path,
    notes: row.notes,
    rolls: (row.fabric_rolls ?? [])
      .map((roll) => ({
        id: roll.id,
        rollNumber: roll.roll_number,
        meters: Number(roll.meters) || 0,
        grade: roll.grade,
        shadeVariation: roll.shade_variation,
      }))
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getUserId() {
  const { data, error } = await createClient().auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user.id
}

function validateChallan(file: File) {
  if (!ALLOWED_CHALLAN_TYPES.has(file.type)) {
    throw new Error('Challan must be a PDF, JPG, PNG, or WebP file.')
  }
  if (file.size > MAX_CHALLAN_BYTES) {
    throw new Error('Challan file must be 10 MB or smaller.')
  }
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'challan'
}

export function createEmptyFabricLot(): FabricLotInput {
  return {
    id: generateId(),
    productionCompany: '',
    partyName: '',
    challanNumber: '',
    challanDate: new Date().toISOString().slice(0, 10),
    lotNumber: '',
    category: '',
    quality: '',
    shade: '',
    variation: '',
    construction: '',
    widthInches: null,
    gsm: null,
    hsnCode: '',
    ratePerMeter: 0,
    gstRate: 0,
    status: 'inward',
    challanFilePath: '',
    notes: '',
    rolls: [
      {
        id: generateId(),
        rollNumber: '1',
        meters: 0,
        grade: 'A',
        shadeVariation: '',
      },
    ],
  }
}

export function totalFabricMeters(lot: Pick<FabricLot, 'rolls'>) {
  return lot.rolls.reduce((sum, roll) => sum + roll.meters, 0)
}

export async function listFabricLots(): Promise<FabricLot[]> {
  const { data, error } = await createClient()
    .from('fabric_lots')
    .select('*, fabric_rolls(*)')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as FabricLotRow[]).map(fromRow)
}

export async function saveFabricLot(
  input: FabricLotInput,
  challanFile: File | null,
): Promise<void> {
  const supabase = createClient()
  const userId = await getUserId()
  const previousPath = input.challanFilePath
  let nextPath = previousPath
  let uploadedPath = ''

  if (challanFile) {
    validateChallan(challanFile)
    uploadedPath = [
      userId,
      input.id,
      Date.now() + '-' + safeFileName(challanFile.name),
    ].join('/')

    const { error: uploadError } = await supabase.storage
      .from(CHALLAN_BUCKET)
      .upload(uploadedPath, challanFile, {
        cacheControl: '3600',
        contentType: challanFile.type,
        upsert: false,
      })
    if (uploadError) throw uploadError
    nextPath = uploadedPath
  }

  const validRolls = input.rolls.filter(
    (roll) => Number.isFinite(roll.meters) && roll.meters > 0,
  )

  const { error } = await supabase.rpc('save_fabric_lot', {
    p_id: input.id,
    p_production_company: input.productionCompany,
    p_party_name: input.partyName,
    p_challan_number: input.challanNumber,
    p_challan_date: input.challanDate || null,
    p_lot_number: input.lotNumber,
    p_category: input.category,
    p_quality: input.quality,
    p_shade: input.shade,
    p_variation: input.variation,
    p_construction: input.construction,
    p_width_inches: input.widthInches,
    p_gsm: input.gsm,
    p_hsn_code: input.hsnCode,
    p_rate_per_meter: input.ratePerMeter,
    p_gst_rate: input.gstRate,
    p_status: input.status,
    p_challan_file_path: nextPath,
    p_notes: input.notes,
    p_rolls: validRolls,
  })

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(CHALLAN_BUCKET).remove([uploadedPath])
    }
    throw error
  }

  if (uploadedPath && previousPath && previousPath !== uploadedPath) {
    await supabase.storage.from(CHALLAN_BUCKET).remove([previousPath])
  }
}

export async function deleteFabricLot(lot: FabricLot): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('fabric_lots').delete().eq('id', lot.id)
  if (error) throw error

  if (lot.challanFilePath) {
    await supabase.storage
      .from(CHALLAN_BUCKET)
      .remove([lot.challanFilePath])
  }
}

export async function downloadFabricChallan(path: string): Promise<Blob> {
  const { data, error } = await createClient().storage
    .from(CHALLAN_BUCKET)
    .download(path)
  if (error) throw error
  return data
}
