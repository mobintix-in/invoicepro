'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Auth pages are full-bleed — no sidebar, no offset.
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/auth/')
  if (isAuthRoute) return <>{children}</>

  return (
    <div>
      <Sidebar />
      {/* Offset content by the sidebar width on desktop; full width on mobile. */}
      <div className="md:pl-64">{children}</div>
    </div>
  )
}
