'use client'

export interface InvoiceTemplateOption {
  id: string
  name: string
  tag: string
  description: string
  icon: (color: string) => React.ReactNode
}

export const TEMPLATES: InvoiceTemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic GST',
    tag: 'Standard / Tally',
    description: 'Statutory Indian GST format with full grid borders, formal consignee box, and HSN breakdown.',
    icon: (color: string) => (
      <svg viewBox="0 0 100 70" className="w-full h-14 rounded border border-gray-200 bg-white p-1 shadow-xs">
        <rect x="4" y="4" width="44" height="20" fill={`${color}15`} stroke={color} strokeWidth="1.2" rx="1" />
        <rect x="52" y="4" width="44" height="20" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="1" />
        <rect x="4" y="27" width="92" height="22" fill="#fff" stroke="#cbd5e1" strokeWidth="1" rx="1" />
        <line x1="4" y1="34" x2="96" y2="34" stroke={color} strokeWidth="1.2" />
        <line x1="40" y1="27" x2="40" y2="49" stroke="#cbd5e1" strokeWidth="0.8" />
        <line x1="70" y1="27" x2="70" y2="49" stroke="#cbd5e1" strokeWidth="0.8" />
        <rect x="4" y="52" width="44" height="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="1" />
        <rect x="52" y="52" width="44" height="14" fill={`${color}10`} stroke={color} strokeWidth="1" rx="1" />
      </svg>
    ),
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    tag: 'Clean & Sleek',
    description: 'Borderless contemporary layout with generous typography, soft dividers, and floating payment card.',
    icon: (color: string) => (
      <svg viewBox="0 0 100 70" className="w-full h-14 rounded border border-gray-200 bg-white p-1 shadow-xs">
        <circle cx="12" cy="12" r="6" fill={color} />
        <rect x="24" y="8" width="30" height="4" fill="#334155" rx="1" />
        <rect x="24" y="15" width="20" height="3" fill="#94a3b8" rx="0.5" />
        <rect x="68" y="8" width="26" height="10" fill={`${color}20`} rx="2" />
        <line x1="6" y1="26" x2="94" y2="26" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="6" y="30" width="88" height="5" fill={`${color}12`} rx="1" />
        <line x1="6" y1="40" x2="94" y2="40" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="6" y1="48" x2="94" y2="48" stroke="#f1f5f9" strokeWidth="1" />
        <rect x="56" y="53" width="38" height="13" fill={color} rx="2" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: 'corporate',
    name: 'Corporate Banner',
    tag: 'Bold & Premium',
    description: 'Header colored banner with high contrast, elegant client cards, and high-impact totals summary.',
    icon: (color: string) => (
      <svg viewBox="0 0 100 70" className="w-full h-14 rounded border border-gray-200 bg-white p-0 shadow-xs overflow-hidden">
        <rect x="0" y="0" width="100" height="18" fill={color} />
        <rect x="6" y="6" width="35" height="4" fill="#ffffff" rx="1" />
        <rect x="70" y="6" width="24" height="6" fill="#ffffff" opacity="0.3" rx="1" />
        <rect x="6" y="22" width="42" height="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" rx="1.5" />
        <rect x="52" y="22" width="42" height="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" rx="1.5" />
        <rect x="6" y="39" width="88" height="6" fill={`${color}25`} rx="1" />
        <line x1="6" y1="49" x2="94" y2="49" stroke="#e2e8f0" strokeWidth="0.8" />
        <line x1="6" y1="56" x2="94" y2="56" stroke="#e2e8f0" strokeWidth="0.8" />
        <rect x="58" y="59" width="36" height="8" fill={color} rx="1" />
      </svg>
    ),
  },
  {
    id: 'compact',
    name: 'Compact Ledger',
    tag: 'Dense / High-Volume',
    description: 'Space-optimized ledger design with clear horizontal dividers, engineered for multi-item invoices.',
    icon: (color: string) => (
      <svg viewBox="0 0 100 70" className="w-full h-14 rounded border border-gray-200 bg-white p-1 shadow-xs">
        <rect x="6" y="6" width="40" height="8" fill={color} rx="1" />
        <rect x="65" y="6" width="28" height="4" fill="#64748b" rx="0.5" />
        <line x1="6" y1="18" x2="94" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="6" y1="26" x2="94" y2="26" stroke="#cbd5e1" strokeWidth="0.8" />
        <line x1="6" y1="33" x2="94" y2="33" stroke="#e2e8f0" strokeWidth="0.8" />
        <line x1="6" y1="40" x2="94" y2="40" stroke="#e2e8f0" strokeWidth="0.8" />
        <line x1="6" y1="47" x2="94" y2="47" stroke="#e2e8f0" strokeWidth="0.8" />
        <line x1="6" y1="54" x2="94" y2="54" stroke="#cbd5e1" strokeWidth="0.8" />
        <rect x="50" y="57" width="44" height="8" fill={`${color}20`} stroke={color} strokeWidth="0.8" rx="1" />
      </svg>
    ),
  },
]

export const THEMES = [
  { key: 'indigo',  label: 'Indigo',   color: '#4F46E5' },
  { key: 'violet',  label: 'Violet',   color: '#7C3AED' },
  { key: 'blue',    label: 'Blue',     color: '#2563EB' },
  { key: 'emerald', label: 'Emerald',  color: '#059669' },
  { key: 'teal',    label: 'Teal',     color: '#0D9488' },
  { key: 'rose',    label: 'Rose',     color: '#E11D48' },
  { key: 'slate',   label: 'Slate',    color: '#334155' },
]

interface Props {
  selectedTemplate?: string
  selectedTheme?: string
  onTemplateChange: (template: string) => void
  onThemeChange: (theme: string) => void
}

export default function InvoiceThemePicker({
  selectedTemplate = 'classic',
  selectedTheme = 'indigo',
  onTemplateChange,
  onThemeChange,
}: Props) {
  const activeColor = THEMES.find((t) => t.key === selectedTheme)?.color || '#4F46E5'

  return (
    <div className="space-y-6">
      {/* 1. Structural Templates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            1. Invoice Layout Structure
          </label>
          <span className="text-xs font-medium text-indigo-600">
            {TEMPLATES.find((t) => t.id === selectedTemplate)?.name} selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {TEMPLATES.map((tmpl) => {
            const isSelected = (selectedTemplate || 'classic') === tmpl.id
            return (
              <div
                key={tmpl.id}
                onClick={() => onTemplateChange(tmpl.id)}
                className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      {tmpl.name}
                      {isSelected && (
                        <span className="inline-flex items-center rounded-full bg-indigo-600 p-0.5 text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </h3>
                    <span className="inline-block mt-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                      {tmpl.tag}
                    </span>
                  </div>
                </div>

                <div className="my-2">{tmpl.icon(activeColor)}</div>

                <p className="mt-auto text-xs text-gray-500 leading-relaxed">{tmpl.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Color Accents */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          2. Accent Color
        </label>
        <div className="flex flex-wrap gap-2.5">
          {THEMES.map((t) => {
            const selected = (selectedTheme || 'indigo') === t.key
            return (
              <button
                key={t.key}
                type="button"
                title={t.label}
                onClick={() => onThemeChange(t.key)}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                  selected
                    ? 'border-gray-900 shadow-md scale-105'
                    : 'border-transparent hover:border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: `${t.color}15` }}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full flex-shrink-0 shadow-xs ring-1 ring-black/10"
                  style={{ backgroundColor: t.color }}
                />
                <span style={{ color: t.color }}>{t.label}</span>
                {selected && (
                  <svg
                    className="h-3 w-3 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: t.color }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
