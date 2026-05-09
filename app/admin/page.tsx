'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { formatDate } from '@/app/lib/utils'

type Profile = {
  id: string
  email: string
  role: 'admin' | 'user'
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const supabase = createClient()
      setLoading(true)

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        router.push('/login')
        return
      }

      // Fetch the current user's profile to check if they are an admin
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profileError || currentProfile?.role !== 'admin') {
        setError('Access denied. You must be an administrator to view this page.')
        return
      }

      // Fetch all profiles
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (allProfilesError) {
        setError('Failed to load profiles.')
      } else {
        setProfiles((allProfiles as Profile[]) || [])
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(id: string, updates: Partial<Profile>) {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      
    if (error) {
      alert('Failed to update profile: ' + error.message)
    } else {
      // Optimistically update the UI
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage system users, roles, and billing status.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {profiles.map((profile) => (
                <tr key={profile.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{profile.email}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{profile.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(profile.created_at.split('T')[0])}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={profile.payment_status}
                      onChange={(e) => updateProfile(profile.id, { payment_status: e.target.value as any })}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={profile.role}
                      onChange={(e) => updateProfile(profile.id, { role: e.target.value as any })}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
