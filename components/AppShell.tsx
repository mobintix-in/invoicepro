'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // The marketing home and login screens are full-bleed — no sidebar, no offset.
  if (pathname === '/welcome' || pathname === '/login') return <>{children}</>

  return (
    <div>
      <Sidebar />
      {/* Offset content by the sidebar width on desktop; full width on mobile. */}
      <div className="md:pl-64">{children}</div>
    </div>
  )
}
