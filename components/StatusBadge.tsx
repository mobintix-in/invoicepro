import type { InvoiceStatus } from '@/types'

const config: Record<InvoiceStatus, { label: string; bg: string; text: string; ring: string; dot: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', dot: 'bg-slate-400' },
  sent: { label: 'Sent', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  overdue: { label: 'Overdue', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', dot: 'bg-rose-500' },
}

export default function StatusBadge({
  status,
  size = 'sm',
}: {
  status: InvoiceStatus
  size?: 'sm' | 'md'
}) {
  const item = config[status] ?? config.draft
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-full ring-1 ring-inset ${item.bg} ${item.text} ${item.ring} ${
        size === 'md' ? 'px-3 py-1 text-xs gap-1.5' : 'px-2.5 py-0.5 text-[11px] gap-1.5'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      <span>{item.label}</span>
    </span>
  )
}
