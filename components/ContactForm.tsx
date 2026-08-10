'use client'

import { useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { submitContactMessage } from '@/lib/contact'

// Fallback inbox used only when Supabase isn't configured (local dev).
const CONTACT_EMAIL = 'hello@invoicepro.app'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Without a backend, fall back to opening the visitor's email client.
    if (!isSupabaseConfigured()) {
      const subject = encodeURIComponent(`InvoicePro enquiry from ${name || 'a visitor'}`)
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
      setSent(true)
      return
    }

    setSubmitting(true)
    try {
      await submitContactMessage({ name, email, message })
      setSent(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sorry, we couldn’t send your message. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="c-name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="c-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>
      <div>
        <label htmlFor="c-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="c-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>
      <div>
        <label htmlFor="c-message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="c-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className={`mt-1.5 ${inputClass} resize-none`}
        />
      </div>
      {sent && (
        <p className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
          Thanks! We’ve received your message and will get back to you within one business day.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
