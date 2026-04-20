/**
 * Composable para gestión del historial de simulaciones.
 * Extiende el historial en memoria con persistencia en Firebase Firestore.
 * Si Firebase no está configurado, funciona solo en memoria (sin cambios al comportamiento previo).
 */
import { ref, computed } from 'vue'
import type { SimulationResult, OccupancyStatus } from '@/models/occupancyModel'
import { statusLabel } from '@/models/occupancyModel'
import { firebaseService } from '@/services/firebase'

export interface HistoryEntry {
  id: number
  firestoreId?: string   // ID en Firestore (si se guardó)
  timestamp: string
  horizon: string
  patients: number
  admissions: number
  discharges: number
  finalOccupancy: number
  peakOccupancy: number
  status: OccupancyStatus
  result: SimulationResult
  /** Nombre del hospital seleccionado en el mapa (opcional) */
  hospitalName?: string
}

const history = ref<HistoryEntry[]>([])
let nextId = 1

export function useHistory() {
  /**
   * Agrega una entrada al historial local y opcionalmente la persiste en Firestore.
   */
  async function addEntry(
    patients: number,
    admissions: number,
    discharges: number,
    horizon: number,
    result: SimulationResult,
    capacity: number = 200,
    hospitalName?: string,
    hospitalId?: string,
  ) {
    const horizonLabel = horizon === 0 ? 'Ahora' : `${horizon}h`

    const entry: HistoryEntry = {
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
      hospitalName,
    }

    history.value.unshift(entry)
    if (history.value.length > 50) history.value.pop()

    // Persistencia en Firestore (asíncrona, sin bloquear la UI)
    if (firebaseService.isAvailable) {
      const firestoreId = await firebaseService.saveSimulation(
        { patients, admissions, discharges, capacity, horizon },
        result,
        hospitalName,
        hospitalId,
      )
      if (firestoreId) entry.firestoreId = firestoreId
    }
  }

  /**
   * Carga el historial desde Firestore y lo fusiona con el historial en memoria.
   * Solo se llama si Firebase está disponible.
   */
  async function loadFromFirestore() {
    if (!firebaseService.isAvailable) return
    const remote = await firebaseService.fetchHistory(50)

    // Convertir entradas de Firestore al formato local
    const converted: HistoryEntry[] = remote.map((fe, idx) => ({
      id: -(idx + 1),              // IDs negativos para diferenciarlos de los locales
      firestoreId: fe.id,
      timestamp: new Date(fe.timestampISO).toLocaleString('es-MX'),
      horizon: fe.input.horizon === 0 ? 'Ahora' : `${fe.input.horizon}h`,
      patients: fe.input.patients,
      admissions: fe.input.admissions,
      discharges: fe.input.discharges,
      finalOccupancy: fe.result.finalOccupancy,
      peakOccupancy: fe.result.peakOccupancy,
      status: fe.result.status,
      hospitalName: fe.hospitalName,
      result: {
        points: [],   // No almacenamos puntos de gráfica en Firestore para ahorrar espacio
        finalOccupancy: fe.result.finalOccupancy,
        peakOccupancy: fe.result.peakOccupancy,
        peakTime: fe.result.peakTime,
        timeConstant: fe.result.timeConstant,
        status: fe.result.status,
        alert: fe.result.alert,
      },
    }))

    // Merge: evitar duplicados por firestoreId
    const existingFirestoreIds = new Set(history.value.map(e => e.firestoreId).filter(Boolean))
    const newEntries = converted.filter(e => !existingFirestoreIds.has(e.firestoreId))
    history.value.push(...newEntries)
    history.value.sort((a, b) => b.id - a.id)
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

  return {
    history,
    addEntry,
    loadFromFirestore,
    averageOccupancy,
    statusDistribution,
    trend,
    clearHistory,
    getStatusLabel,
    isFirebaseEnabled: firebaseService.isAvailable,
  }
}