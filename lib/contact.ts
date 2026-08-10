import { createClient } from '@/lib/supabase/client'

// Contact-form messages. Submitting is open to everyone (the "Anyone can submit
// a message" RLS policy); reading/handling/deleting is admin-only.

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  handled: boolean
  createdAt: string
}

type ContactRow = {
  id: string
  name: string
  email: string
  message: string
  handled: boolean
  created_at: string
}

/** Persist a message from the public "Talk to us" form. */
export async function submitContactMessage(input: {
  name: string
  email: string
  message: string
}): Promise<void> {
  const { error } = await createClient().rpc('submit_contact_message', {
    p_name: input.name.trim().slice(0, 200),
    p_email: input.email.trim().slice(0, 200),
    p_message: input.message.trim().slice(0, 5000),
  })
  if (error) {
    if (error.message.includes('CONTACT_RATE_LIMITED')) {
      throw new Error('Too many messages. Please wait a few minutes and try again.')
    }
    throw error
  }
}

/** Every message, newest first — admins only, via RLS. */
export async function listContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await createClient()
    .from('contact_messages')
    .select('id, name, email, message, handled, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ContactRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    handled: r.handled,
    createdAt: r.created_at,
  }))
}

export async function setMessageHandled(id: string, handled: boolean): Promise<void> {
  const { error } = await createClient()
    .from('contact_messages')
    .update({ handled })
    .eq('id', id)
  if (error) throw error
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await createClient().from('contact_messages').delete().eq('id', id)
  if (error) throw error
}
