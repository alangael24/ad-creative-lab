import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard'

export default function PerformancePage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rendimiento</h1>
        <p className="text-muted-foreground">Seguimiento de gasto y rendimiento de tus ads</p>
      </div>
      <PerformanceDashboard />
    </div>
  )
}
