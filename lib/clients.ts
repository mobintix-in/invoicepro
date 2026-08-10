import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'

export interface Client {
  id: string
  name: string
  email: string
  address: string
  phone: string
  gstin: string
  stateName: string
  stateCode: string
  createdAt: string
  updatedAt: string
}

export interface ClientInput {
  id?: string
  name: string
  email: string
  address: string
  phone: string
  gstin: string
  stateName: string
  stateCode: string
}

type ClientRow = {
  id: string
  user_id: string
  name: string
  email: string
  address: string
  phone: string
  gstin: string
  state_name: string
  state_code: string
  created_at: string
  updated_at: string
}

function fromRow(r: ClientRow): Client {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    address: r.address,
    phone: r.phone,
    gstin: r.gstin,
    stateName: r.state_name,
    stateCode: r.state_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

async function getUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await createClient()
    .from('clients')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data as ClientRow[] | null)?.map(fromRow) ?? []
}

export async function saveClient(input: ClientInput): Promise<void> {
  const userId = await getUserId()
  const { error } = await createClient()
    .from('clients')
    .upsert(
      {
        id: input.id ?? generateId(),
        user_id: userId,
        name: input.name.trim(),
        email: input.email.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        gstin: input.gstin.trim(),
        state_name: input.stateName.trim(),
        state_code: input.stateCode.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
  if (error) throw error
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await createClient().from('clients').delete().eq('id', id)
  if (error) throw error
}
