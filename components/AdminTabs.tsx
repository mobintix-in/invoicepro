'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Users', href: '/admin' },
  { name: 'Blog', href: '/admin/blog' },
  { name: 'Packages', href: '/admin/packages' },
]

export default function AdminTabs() {
  const pathname = usePathname()
  return (
    <div className="mb-6 flex gap-1 border-b border-gray-200">
      {tabs.map((t) => {
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.name}
          </Link>
        )
      })}
    </div>
  )
}
