/**
 * Servicio de hospitales con datos simulados para Tlaxcala / zona centro de México.
 * Cuando se integra Mapbox, estos datos se usan como marcadores en el mapa.
 *
 * SETUP MAPBOX:
 *  1. Crea cuenta en https://account.mapbox.com
 *  2. Copia tu Access Token público
 *  3. Añade al .env: VITE_MAPBOX_TOKEN=pk.eyJ1IjoiT...
 *  4. Instala: npm install mapbox-gl
 */

export interface Hospital {
  id: string
  name: string
  lat: number
  lng: number
  /** Camas totales estimadas */
  capacity: number
  /** Pacientes actuales simulados */
  currentPatients: number
  /** Ingresos diarios promedio simulados */
  dailyAdmissions: number
  /** Altas diarias promedio simuladas */
  dailyDischarges: number
  type: 'IMSS' | 'ISSSTE' | 'SSA' | 'Privado'
  city: string
}

/** Hospitales de la zona Tlaxcala / Puebla / CDMX — datos simulados */
export const HOSPITALS: Hospital[] = [
  {
    id: 'tlax-1',
    name: 'Hospital General de Tlaxcala',
    lat: 19.3222,
    lng: -98.2375,
    capacity: 180,
    currentPatients: 112,
    dailyAdmissions: 38,
    dailyDischarges: 34,
    type: 'SSA',
    city: 'Tlaxcala',
  },
  {
    id: 'tlax-2',
    name: 'IMSS UMF 60 Apizaco',
    lat: 19.4236,
    lng: -98.1411,
    capacity: 90,
    currentPatients: 71,
    dailyAdmissions: 22,
    dailyDischarges: 18,
    type: 'IMSS',
    city: 'Apizaco',
  },
  {
    id: 'tlax-3',
    name: 'Hospital ISSSTE Tlaxcala',
    lat: 19.3185,
    lng: -98.2420,
    capacity: 120,
    currentPatients: 88,
    dailyAdmissions: 30,
    dailyDischarges: 27,
    type: 'ISSSTE',
    city: 'Tlaxcala',
  },
  {
    id: 'pue-1',
    name: 'Hospital Ángeles Puebla',
    lat: 19.0629,
    lng: -98.2312,
    capacity: 240,
    currentPatients: 160,
    dailyAdmissions: 55,
    dailyDischarges: 50,
    type: 'Privado',
    city: 'Puebla',
  },
  {
    id: 'pue-2',
    name: 'IMSS HGZ 8 Puebla',
    lat: 19.0521,
    lng: -98.1915,
    capacity: 310,
    currentPatients: 265,
    dailyAdmissions: 80,
    dailyDischarges: 72,
    type: 'IMSS',
    city: 'Puebla',
  },
  {
    id: 'pue-3',
    name: 'Hospital UPAEP',
    lat: 19.0425,
    lng: -98.2101,
    capacity: 150,
    currentPatients: 98,
    dailyAdmissions: 35,
    dailyDischarges: 33,
    type: 'Privado',
    city: 'Puebla',
  },
  {
    id: 'cdmx-1',
    name: 'Hospital General de México',
    lat: 19.4107,
    lng: -99.1470,
    capacity: 850,
    currentPatients: 730,
    dailyAdmissions: 210,
    dailyDischarges: 185,
    type: 'SSA',
    city: 'CDMX',
  },
  {
    id: 'cdmx-2',
    name: 'IMSS CMN Siglo XXI',
    lat: 19.4044,
    lng: -99.1580,
    capacity: 1200,
    currentPatients: 980,
    dailyAdmissions: 290,
    dailyDischarges: 265,
    type: 'IMSS',
    city: 'CDMX',
  },
  {
    id: 'tlax-4',
    name: 'Clínica San Rafael Apizaco',
    lat: 19.4180,
    lng: -98.1378,
    capacity: 60,
    currentPatients: 41,
    dailyAdmissions: 14,
    dailyDischarges: 13,
    type: 'Privado',
    city: 'Apizaco',
  },
  {
    id: 'hid-1',
    name: 'Hospital Regional Pachuca',
    lat: 20.1167,
    lng: -98.7333,
    capacity: 200,
    currentPatients: 155,
    dailyAdmissions: 48,
    dailyDischarges: 43,
    type: 'ISSSTE',
    city: 'Pachuca',
  },
]

/** Color del pin según tipo de hospital */
export function hospitalTypeColor(type: Hospital['type']): string {
  const map: Record<Hospital['type'], string> = {
    IMSS: '#3b82f6',
    ISSSTE: '#8b5cf6',
    SSA: '#10b981',
    Privado: '#f59e0b',
  }
  return map[type]
}

/** Ocupación actual en % */
export function hospitalOccupancy(h: Hospital): number {
  return Math.min((h.currentPatients / h.capacity) * 100, 100)
}