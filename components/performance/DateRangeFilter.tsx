'use client'

import { Input } from '@/components/ui/input'
import { getLocalDateString } from '@/lib/utils'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const presets = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: 'Todo', days: 0 },
  ]

  const handlePreset = (days: number) => {
    if (days === 0) {
      onChange('', '')
    } else {
      const toDate = new Date()
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      onChange(getLocalDateString(fromDate), getLocalDateString(toDate))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.days)}
            className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Desde</label>
        <Input
          type="date"
          className="w-auto h-8"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
        />
        <label className="text-sm text-muted-foreground">Hasta</label>
        <Input
          type="date"
          className="w-auto h-8"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
        />
      </div>
    </div>
  )
}
