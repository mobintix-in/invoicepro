import { createClient } from '@/lib/supabase/client'

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
