'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function getDeviceInfo() {
  if (typeof window === 'undefined') return { device: 'desktop', browser: 'Browser', os: 'OS' }
  const ua = navigator.userAgent
  let device = 'desktop'
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) device = 'mobile'
  else if (/tablet/i.test(ua)) device = 'tablet'

  let browser = 'Chrome'
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  let os = 'Windows'
  if (ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Android')) os = 'Android'

  return { device, browser, os }
}

export default function TrackerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const sessionIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const pageViewsCountRef = useRef<number>(0)

  useEffect(() => {
    // Initialize or restore session ID
    if (typeof window === 'undefined') return

    let sid = sessionStorage.getItem('eloris_live_session_id')
    if (!sid) {
      sid = crypto.randomUUID ? crypto.randomUUID() : `sess_${Math.random().toString(36).substring(2)}${Date.now()}`
      sessionStorage.setItem('eloris_live_session_id', sid)
      sessionStorage.setItem('eloris_live_is_new', 'true')
    }
    sessionIdRef.current = sid

    const isNew = sessionStorage.getItem('eloris_live_is_new') !== 'false'
    sessionStorage.setItem('eloris_live_is_new', 'false')

    const deviceInfo = getDeviceInfo()
    const referrer = document.referrer || ''

    // Helper to send tracking ping
    async function trackPage(path: string, action?: string) {
      pageViewsCountRef.current += 1
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
      const nowIso = new Date().toISOString()

      const sessionPayload = {
        id: sessionIdRef.current!,
        last_seen_at: nowIso,
        is_new: isNew,
        country: 'India',
        country_code: 'IN',
        city: 'Mumbai',
        latitude: 19.0760,
        longitude: 72.8777,
        entry_path: sessionStorage.getItem('eloris_entry_path') || path,
        exit_path: path,
        duration_seconds: durationSeconds,
        page_view_count: pageViewsCountRef.current,
        referrer,
        device_type: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      }

      if (!sessionStorage.getItem('eloris_entry_path')) {
        sessionStorage.setItem('eloris_entry_path', path)
      }

      // 1. BroadcastChannel for zero-latency local inter-tab communication with Admin Live View
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('eloris_live_analytics')
          bc.postMessage({
            type: 'PAGE_VIEW',
            session: sessionPayload,
            path,
            action: action || `Viewed ${path}`,
            viewedAt: nowIso,
          })
          bc.close()
        }
      } catch (e) {
        // ignore broadcast errors
      }

      // 2. Supabase persistence if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()

          // Get current user if logged in
          const { data: authData } = await supabase.auth.getUser()
          const userId = authData.user?.id || null

          // Upsert session
          await supabase.from('sessions').upsert({
            ...sessionPayload,
            ...(userId ? { user_id: userId } : {}),
            started_at: new Date(startTimeRef.current).toISOString(),
          })

          // Insert page view
          await supabase.from('page_views').insert({
            session_id: sessionIdRef.current!,
            path,
            action_name: action || `Viewed ${path}`,
            viewed_at: nowIso,
            ...(userId ? { user_id: userId } : {}),
          })
        } catch (err) {
          // Silent fallback
        }
      }
    }

    // Track initial page view or path change
    trackPage(pathname)

    // Periodic heartbeat every 15s to update last_seen_at
    const heartbeatTimer = setInterval(() => {
      trackPage(pathname, 'Heartbeat')
    }, 15_000)

    // User activity listeners (scroll, click, keydown)
    let lastActivityTime = Date.now()
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivityTime > 10_000) {
        lastActivityTime = now
        trackPage(pathname, 'Active interaction')
      }
    }

    window.addEventListener('scroll', handleActivity, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })

    return () => {
      clearInterval(heartbeatTimer)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [pathname])

  return <>{children}</>
}
