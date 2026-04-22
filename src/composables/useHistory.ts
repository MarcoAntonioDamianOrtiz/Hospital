/**
 * Composable para gestión del historial de simulaciones.
 * Incluye paginación, borrado individual y persistencia en Firestore.
 */
import { ref, computed } from 'vue'
import type { SimulationResult, OccupancyStatus } from '@/models/occupancyModel'
import { statusLabel } from '@/models/occupancyModel'
import { firebaseService } from '@/services/firebase'
import {
  getFirestore,
  doc,
  deleteDoc,
} from 'firebase/firestore'

export interface HistoryEntry {
  id: number
  firestoreId?: string
  timestamp: string
  horizon: string
  patients: number
  admissions: number
  discharges: number
  finalOccupancy: number
  peakOccupancy: number
  status: OccupancyStatus
  result: SimulationResult
  hospitalName?: string
}

const history = ref<HistoryEntry[]>([])
let nextId = 1

// Paginación global
export const PAGE_SIZE = 10

export function useHistory() {
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
    if (history.value.length > 200) history.value.pop()

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
   * Borra una entrada del historial local y de Firestore si está disponible.
   */
  async function deleteEntry(entryId: number): Promise<void> {
    const idx = history.value.findIndex(e => e.id === entryId)
    if (idx === -1) return

    const entry = history.value[idx]

    // Borrar de Firestore si tiene ID
    if (entry.firestoreId && firebaseService.isAvailable) {
      try {
        const db = getFirestore()
        await deleteDoc(doc(db, 'simulaciones', entry.firestoreId))
      } catch (e) {
        console.error('[Firebase] Error al borrar simulación:', e)
      }
    }

    history.value.splice(idx, 1)
  }

  async function loadFromFirestore() {
    if (!firebaseService.isAvailable) return
    const remote = await firebaseService.fetchHistory(200)

    const converted: HistoryEntry[] = remote.map((fe, idx) => ({
      id: -(idx + 1),
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
        points: [],
        finalOccupancy: fe.result.finalOccupancy,
        peakOccupancy: fe.result.peakOccupancy,
        peakTime: fe.result.peakTime,
        timeConstant: fe.result.timeConstant,
        status: fe.result.status,
        alert: fe.result.alert,
      },
    }))

    const existingFirestoreIds = new Set(history.value.map(e => e.firestoreId).filter(Boolean))
    const newEntries = converted.filter(e => !existingFirestoreIds.has(e.firestoreId))
    history.value.push(...newEntries)
    history.value.sort((a, b) => b.id - a.id)
  }

  // ── Computed helpers ──────────────────────────────────────

  const averageOccupancy = computed(() => {
    if (!history.value.length) return 0
    return history.value.reduce((a, e) => a + e.finalOccupancy, 0) / history.value.length
  })

  const statusDistribution = computed(() => {
    const dist: Record<OccupancyStatus, number> = { normal: 0, alto: 0, saturado: 0, colapso: 0 }
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
    deleteEntry,
    loadFromFirestore,
    averageOccupancy,
    statusDistribution,
    trend,
    clearHistory,
    getStatusLabel,
    isFirebaseEnabled: firebaseService.isAvailable,
  }
}