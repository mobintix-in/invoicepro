import { redirect } from 'next/navigation'

export default function SubscribePage() {
  redirect('/profile?tab=subscription')
}
