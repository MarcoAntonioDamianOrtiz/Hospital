/**
 * Firebase / Firestore Service
 * Maneja persistencia del historial de simulaciones.
 *
 * SETUP RÁPIDO:
 *  1. Crea un proyecto en https://console.firebase.google.com
 *  2. Activa Firestore Database (modo test está bien para empezar)
 *  3. Ve a Configuración del proyecto → Tus apps → Web
 *  4. Copia tu firebaseConfig y pégalo en FIREBASE_CONFIG abajo
 *  5. Instala: npm install firebase
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { SimulationResult, OccupancyStatus } from '@/models/occupancyModel'

// ── Reemplaza con tu configuración real de Firebase ─────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCRT7C2_gxH0lK6Fp67_bs0893oW2oUlps",
  authDomain: "hospital-4f5c1.firebaseapp.com",
  projectId: "hospital-4f5c1",
  storageBucket: "hospital-4f5c1.firebasestorage.app",
  messagingSenderId: "9287916114",
  appId: "1:9287916114:web:4355b8d9d8ab87cdce5d8b",
  measurementId: "G-7D8SQB4PY8"
};
// ─────────────────────────────────────────────────────────────────────────────

export interface FirestoreEntry {
  id?: string
  timestamp: Timestamp | Date
  timestampISO: string
  hospitalName?: string
  hospitalId?: string
  input: {
    patients: number
    admissions: number
    discharges: number
    capacity: number
    horizon: number
  }
  result: {
    finalOccupancy: number
    peakOccupancy: number
    peakTime: number
    timeConstant: number
    status: OccupancyStatus
    alert: string | null
  }
}

class FirebaseService {
  private app: FirebaseApp | null = null
  private db: Firestore | null = null
  public isAvailable = false

  constructor() {
    this.init()
  }

  private init() {
    // Solo inicializa si hay credenciales configuradas
    if (!FIREBASE_CONFIG.projectId) {
      console.info('[Firebase] Sin configuración. Historial solo en memoria.')
      return
    }
    try {
      this.app = initializeApp(FIREBASE_CONFIG)
      this.db = getFirestore(this.app)
      this.isAvailable = true
      console.info('[Firebase] Conectado a Firestore.')
    } catch (e) {
      console.warn('[Firebase] No se pudo inicializar:', e)
    }
  }

  /**
   * Guarda una simulación en Firestore.
   * Retorna el ID del documento creado, o null si falla.
   */
  async saveSimulation(
    input: FirestoreEntry['input'],
    result: SimulationResult,
    hospitalName?: string,
    hospitalId?: string,
  ): Promise<string | null> {
    if (!this.db) return null

    const entry: FirestoreEntry = {
      timestamp: Timestamp.now(),
      timestampISO: new Date().toISOString(),
      hospitalName,
      hospitalId,
      input,
      result: {
        finalOccupancy: result.finalOccupancy,
        peakOccupancy: result.peakOccupancy,
        peakTime: result.peakTime,
        timeConstant: result.timeConstant,
        status: result.status,
        alert: result.alert,
      },
    }

    try {
      const ref = await addDoc(collection(this.db, 'simulaciones'), entry)
      return ref.id
    } catch (e) {
      console.error('[Firebase] Error al guardar simulación:', e)
      return null
    }
  }

  /**
   * Obtiene las últimas N simulaciones desde Firestore.
   */
  async fetchHistory(maxEntries = 50): Promise<FirestoreEntry[]> {
    if (!this.db) return []

    try {
      const q = query(
        collection(this.db, 'simulaciones'),
        orderBy('timestamp', 'desc'),
        limit(maxEntries),
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FirestoreEntry))
    } catch (e) {
      console.error('[Firebase] Error al obtener historial:', e)
      return []
    }
  }
}

// Singleton exportado
export const firebaseService = new FirebaseService()