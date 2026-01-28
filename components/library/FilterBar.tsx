"use client"

import { Search, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ANGLES, FORMATS } from '@/lib/constants'

const ELEMENT_OPTIONS = [
  { value: '', label: 'Todos los Elementos' },
  { value: 'hookResult', label: 'Hook' },
  { value: 'avatarResult', label: 'Avatar/Presentador' },
  { value: 'scriptResult', label: 'Guion/Copy' },
  { value: 'ctaResult', label: 'CTA' },
  { value: 'visualResult', label: 'Visual/Estetica' },
  { value: 'audioResult', label: 'Audio/Musica' },
]

interface FilterBarProps {
  resultFilter: string
  angleFilter: string
  formatFilter: string
  searchQuery: string
  elementFilter: string
  elementStatus: string
  onResultChange: (value: string) => void
  onAngleChange: (value: string) => void
  onFormatChange: (value: string) => void
  onSearchChange: (value: string) => void
  onElementChange: (value: string) => void
  onElementStatusChange: (value: string) => void
}

const RESULT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'winner', label: 'Solo Winners' },
  { value: 'loser', label: 'Solo Losers' },
]

export function FilterBar({
  resultFilter,
  angleFilter,
  formatFilter,
  searchQuery,
  elementFilter,
  elementStatus,
  onResultChange,
  onAngleChange,
  onFormatChange,
  onSearchChange,
  onElementChange,
  onElementStatusChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg">
        {/* Result Filter Buttons */}
        <div className="flex gap-1">
          {RESULT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={resultFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onResultChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Angle Filter */}
        <Select
          options={[{ value: '', label: 'Todos los Angulos' }, ...ANGLES]}
          value={angleFilter}
          onChange={(e) => onAngleChange(e.target.value)}
          className="w-40"
        />

        {/* Format Filter */}
        <Select
          options={[{ value: '', label: 'Todos los Formatos' }, ...FORMATS]}
          value={formatFilter}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-40"
        />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por concepto, diagnostico..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Element Filter */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
        <span className="text-sm text-muted-foreground">Filtrar por elemento:</span>
        <Select
          options={ELEMENT_OPTIONS}
          value={elementFilter}
          onChange={(e) => onElementChange(e.target.value)}
          className="w-48"
        />
        {elementFilter && (
          <div className="flex gap-1">
            <Button
              variant={elementStatus === 'worked' ? 'default' : 'outline'}
              size="sm"
              className={elementStatus === 'worked' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => onElementStatusChange(elementStatus === 'worked' ? '' : 'worked')}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Funciono
            </Button>
            <Button
              variant={elementStatus === 'failed' ? 'default' : 'outline'}
              size="sm"
              className={elementStatus === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => onElementStatusChange(elementStatus === 'failed' ? '' : 'failed')}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Fallo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
