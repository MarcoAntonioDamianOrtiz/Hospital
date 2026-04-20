/**
 * Composable para gestión del historial de simulaciones.
 * Guarda los últimos resultados para la vista de Estadísticas.
 */
import { ref, computed } from 'vue'
import type { SimulationResult, OccupancyStatus } from '@/models/occupancyModel'
import { statusLabel } from '@/models/occupancyModel'

export interface HistoryEntry {
  id: number
  timestamp: string
  horizon: string
  patients: number
  admissions: number
  discharges: number
  finalOccupancy: number
  peakOccupancy: number
  status: OccupancyStatus
  result: SimulationResult
}

const history = ref<HistoryEntry[]>([])
let nextId = 1

export function useHistory() {
  function addEntry(
    patients: number,
    admissions: number,
    discharges: number,
    horizon: number,
    result: SimulationResult
  ) {
    const horizonLabel =
      horizon === 0 ? 'Ahora' : `${horizon}h`

    history.value.unshift({
      id: nextId++,
      timestamp: new Date().toLocaleString('es-MX'),
      horizon: horizonLabel,
      patients,
      admissions,
      discharges,
      finalOccupancy: result.finalOccupancy,
      peakOccupancy: result.peakOccupancy,
      status: result.status,
      result,
    })

    // Mantener máximo 50 entradas
    if (history.value.length > 50) history.value.pop()
  }

  const averageOccupancy = computed(() => {
    if (!history.value.length) return 0
    const sum = history.value.reduce((a, e) => a + e.finalOccupancy, 0)
    return sum / history.value.length
  })

  const statusDistribution = computed(() => {
    const dist: Record<OccupancyStatus, number> = {
      normal: 0, alto: 0, saturado: 0, colapso: 0,
    }
    history.value.forEach(e => dist[e.status]++)
    return dist
  })

  const trend = computed(() => {
    if (history.value.length < 2) return 'estable'
    const recent = history.value.slice(0, 5)
    const older = history.value.slice(5, 10)
    if (!older.length) return 'estable'
    const recentAvg = recent.reduce((a, e) => a + e.finalOccupancy, 0) / recent.length
    const olderAvg = older.reduce((a, e) => a + e.finalOccupancy, 0) / older.length
    if (recentAvg > olderAvg + 5) return 'subiendo'
    if (recentAvg < olderAvg - 5) return 'bajando'
    return 'estable'
  })

  function getStatusLabel(s: OccupancyStatus) { return statusLabel(s) }

  function clearHistory() { history.value = [] }

  return { history, addEntry, averageOccupancy, statusDistribution, trend, clearHistory, getStatusLabel }
}
