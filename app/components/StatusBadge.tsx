import type { InvoiceStatus } from '@/app/lib/types'

const config: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 ring-gray-200' },
  sent: { label: 'Sent', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  paid: { label: 'Paid', className: 'bg-green-50 text-green-700 ring-green-200' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 ring-red-200' },
}

export default function StatusBadge({
  status,
  size = 'sm',
}: {
  status: InvoiceStatus
  size?: 'sm' | 'md'
}) {
  const { label, className } = config[status]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${className} ${
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {label}
    </span>
  )
}
