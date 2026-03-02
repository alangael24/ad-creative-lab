'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Check, X, BarChart3 } from 'lucide-react'
import { formatCurrency, getLocalDateString } from '@/lib/utils'

interface DailyMetric {
  id: string
  date: string
  spend: number
  impressions: number
  clicks: number
  purchases: number
  revenue: number
  videoViewThreeSeconds: number
  videoViewThruplay: number
}

const emptyRow = {
  date: getLocalDateString(),
  spend: '',
  impressions: '',
  clicks: '',
  purchases: '',
  revenue: '',
  videoViewThreeSeconds: '',
  videoViewThruplay: '',
}

export function DailyMetricsLog({ adId }: { adId: string }) {
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRow, setNewRow] = useState(emptyRow)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState(emptyRow)

  const fetchMetrics = useCallback(async () => {
    const res = await fetch(`/api/ads/${adId}/metrics`)
    const data = await res.json()
    setMetrics(data)
    setLoading(false)
  }, [adId])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleAdd = async () => {
    if (!newRow.date) return
    setSaving(true)
    const res = await fetch(`/api/ads/${adId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: newRow.date,
        spend: parseFloat(newRow.spend as string) || 0,
        impressions: parseInt(newRow.impressions as string) || 0,
        clicks: parseInt(newRow.clicks as string) || 0,
        purchases: parseInt(newRow.purchases as string) || 0,
        revenue: parseFloat(newRow.revenue as string) || 0,
        videoViewThreeSeconds: parseInt(newRow.videoViewThreeSeconds as string) || 0,
        videoViewThruplay: parseInt(newRow.videoViewThruplay as string) || 0,
      }),
    })

    if (res.ok) {
      setNewRow(emptyRow)
      setShowAdd(false)
      await fetchMetrics()
    } else {
      const err = await res.json()
      alert(err.error || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleEdit = async (id: string) => {
    setSaving(true)
    await fetch(`/api/ads/${adId}/metrics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spend: parseFloat(editRow.spend as string) || 0,
        impressions: parseInt(editRow.impressions as string) || 0,
        clicks: parseInt(editRow.clicks as string) || 0,
        purchases: parseInt(editRow.purchases as string) || 0,
        revenue: parseFloat(editRow.revenue as string) || 0,
        videoViewThreeSeconds: parseInt(editRow.videoViewThreeSeconds as string) || 0,
        videoViewThruplay: parseInt(editRow.videoViewThruplay as string) || 0,
      }),
    })
    setEditingId(null)
    await fetchMetrics()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/ads/${adId}/metrics/${id}`, { method: 'DELETE' })
    await fetchMetrics()
  }

  const startEdit = (m: DailyMetric) => {
    setEditingId(m.id)
    setEditRow({
      date: m.date.split('T')[0],
      spend: String(m.spend),
      impressions: String(m.impressions),
      clicks: String(m.clicks),
      purchases: String(m.purchases),
      revenue: String(m.revenue),
      videoViewThreeSeconds: String(m.videoViewThreeSeconds),
      videoViewThruplay: String(m.videoViewThruplay),
    })
  }

  const totals = metrics.reduce(
    (acc, m) => ({
      spend: acc.spend + m.spend,
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      purchases: acc.purchases + m.purchases,
      revenue: acc.revenue + m.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0 }
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">Cargando metricas...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Metricas Diarias</CardTitle>
            {metrics.length > 0 && (
              <Badge variant="secondary">{metrics.length} entradas</Badge>
            )}
          </div>
          {!showAdd && (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add form */}
        {showAdd && (
          <div className="mb-4 p-3 border rounded-lg bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Fecha</label>
                <Input
                  type="date"
                  value={newRow.date}
                  onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Gasto ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newRow.spend}
                  onChange={(e) => setNewRow({ ...newRow, spend: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Impresiones</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRow.impressions}
                  onChange={(e) => setNewRow({ ...newRow, impressions: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Clicks</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRow.clicks}
                  onChange={(e) => setNewRow({ ...newRow, clicks: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Compras</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRow.purchases}
                  onChange={(e) => setNewRow({ ...newRow, purchases: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Revenue ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newRow.revenue}
                  onChange={(e) => setNewRow({ ...newRow, revenue: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Vistas 3s</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRow.videoViewThreeSeconds}
                  onChange={(e) => setNewRow({ ...newRow, videoViewThreeSeconds: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Thruplay</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRow.videoViewThruplay}
                  onChange={(e) => setNewRow({ ...newRow, videoViewThruplay: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewRow(emptyRow) }}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {metrics.length === 0 && !showAdd ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sin metricas registradas. Agrega datos diarios para hacer seguimiento.
          </p>
        ) : metrics.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-2 font-medium">Fecha</th>
                  <th className="text-right py-2 px-2 font-medium">Gasto</th>
                  <th className="text-right py-2 px-2 font-medium">Impr.</th>
                  <th className="text-right py-2 px-2 font-medium">Clicks</th>
                  <th className="text-right py-2 px-2 font-medium">Compras</th>
                  <th className="text-right py-2 px-2 font-medium">Revenue</th>
                  <th className="text-right py-2 pl-2 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    {editingId === m.id ? (
                      <>
                        <td className="py-2 pr-2 text-sm">
                          {new Date(m.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 text-right text-sm"
                            value={editRow.spend}
                            onChange={(e) => setEditRow({ ...editRow, spend: e.target.value })}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            type="number"
                            className="h-7 text-right text-sm"
                            value={editRow.impressions}
                            onChange={(e) => setEditRow({ ...editRow, impressions: e.target.value })}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            type="number"
                            className="h-7 text-right text-sm"
                            value={editRow.clicks}
                            onChange={(e) => setEditRow({ ...editRow, clicks: e.target.value })}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            type="number"
                            className="h-7 text-right text-sm"
                            value={editRow.purchases}
                            onChange={(e) => setEditRow({ ...editRow, purchases: e.target.value })}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 text-right text-sm"
                            value={editRow.revenue}
                            onChange={(e) => setEditRow({ ...editRow, revenue: e.target.value })}
                          />
                        </td>
                        <td className="py-2 pl-2">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleEdit(m.id)}
                              disabled={saving}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-muted-foreground hover:bg-muted rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-2">
                          {new Date(m.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-2 px-2 text-right">{formatCurrency(m.spend)}</td>
                        <td className="py-2 px-2 text-right">{m.impressions.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right">{m.clicks.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right">{m.purchases}</td>
                        <td className="py-2 px-2 text-right">{formatCurrency(m.revenue)}</td>
                        <td className="py-2 pl-2">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => startEdit(m)}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t-2 font-medium">
                  <td className="py-2 pr-2">Total</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(totals.spend)}</td>
                  <td className="py-2 px-2 text-right">{totals.impressions.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right">{totals.clicks.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right">{totals.purchases}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(totals.revenue)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
