<template>
  <div class="user-view">
    <header class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">Consulta de Hospitales</h1>
        <p class="page-sub">Busca disponibilidad en tiempo real y simula ocupación</p>
      </div>
      <div class="search-bar-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="searchQuery" class="search-input" placeholder="Buscar hospital, ciudad o tipo..." />
      </div>
    </header>

    <!-- Filtros rápidos -->
    <div class="filters-row">
      <div class="filters-scroll">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          <span class="filter-dot" :style="{ background: f.color }"></span>
          {{ f.label }}
        </button>
      </div>
      <div class="filter-sort">
        <span class="label sort-label">Ordenar:</span>
        <select v-model="sortBy" class="sort-select">
          <option value="occupancy-asc">Menor ocupación</option>
          <option value="occupancy-desc">Mayor ocupación</option>
          <option value="capacity">Mayor capacidad</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
    </div>

    <!-- Recomendación del sistema -->
    <Transition name="slide-up">
      <div v-if="bestHospital" class="recommendation-banner card">
        <div class="rec-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Recomendado
        </div>
        <div class="rec-info">
          <p class="rec-title">{{ bestHospital.name }}</p>
          <p class="rec-meta">
            {{ bestHospital.city }} · {{ bestHospital.type }} ·
            <strong style="color: var(--status-normal)">{{ hospitalOccupancy(bestHospital).toFixed(0) }}% ocupación</strong>
          </p>
        </div>
        <button class="btn-go-best" @click="selectHospital(bestHospital)">
          Ver detalles
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Grid de hospitales -->
    <div class="hospitals-grid">
      <button
        v-for="h in sortedHospitals"
        :key="h.id"
        class="hospital-card card"
        :class="{ selected: selectedId === h.id }"
        @click="selectHospital(h)"
      >
        <div class="hosp-card-top">
          <span class="type-pill" :style="{ background: typeColors[h.type] + '22', color: typeColors[h.type], borderColor: typeColors[h.type] + '55' }">
            {{ h.type }}
          </span>
          <span class="hosp-city-tag">{{ h.city }}</span>
        </div>
        <h3 class="hosp-card-name">{{ h.name }}</h3>
        <div class="occ-display">
          <div class="occ-ring-wrap">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                :stroke="occColor(h)"
                stroke-width="5"
                stroke-linecap="round"
                :stroke-dasharray="`${(hospitalOccupancy(h) / 100) * 138} 138`"
                transform="rotate(-90 28 28)"
                style="transition: stroke-dasharray 0.6s"
              />
            </svg>
            <span class="occ-pct mono" :style="{ color: occColor(h) }">
              {{ hospitalOccupancy(h).toFixed(0) }}<small>%</small>
            </span>
          </div>
          <div class="occ-stats">
            <div class="occ-stat">
              <span class="occ-label">Camas libres</span>
              <span class="occ-val mono" style="color: var(--status-normal)">
                {{ Math.max(0, h.capacity - h.currentPatients) }}
              </span>
            </div>
            <div class="occ-stat">
              <span class="occ-label">Total camas</span>
              <span class="occ-val mono">{{ h.capacity }}</span>
            </div>
            <div class="occ-stat">
              <span class="occ-label">Ingresos/día</span>
              <span class="occ-val mono">{{ h.dailyAdmissions }}</span>
            </div>
          </div>
        </div>
        <div class="hosp-status-row">
          <StatusBadge :status="occStatus(h)" />
          <span class="select-hint" v-if="selectedId !== h.id">Simular →</span>
          <span class="selected-hint" v-else>✓ Seleccionado</span>
        </div>
      </button>
    </div>

    <!-- Simulador del hospital seleccionado -->
    <Transition name="slide-up">
      <div v-if="selectedHospital" class="sim-panel card">
        <div class="sim-header">
          <div class="sim-hosp-info">
            <div class="sim-pin" :style="{ background: typeColors[selectedHospital.type] }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
              </svg>
            </div>
            <div>
              <h3 class="sim-title">{{ selectedHospital.name }}</h3>
              <p class="sim-meta">Datos preconfigurados por el administrador</p>
            </div>
          </div>
          <div class="sim-horizons">
            <button
              v-for="h in horizons"
              :key="h.value"
              class="h-btn"
              :class="{ active: horizon === h.value }"
              @click="runSim(h.value)"
            >{{ h.label }}</button>
          </div>
        </div>

        <div class="sim-body" v-if="simResult">
          <div class="sim-metrics">
            <div class="sim-metric card">
              <p class="label">Estado proyectado</p>
              <StatusBadge :status="simResult.status" style="margin-top:0.5rem" />
            </div>
            <div class="sim-metric card">
              <p class="label">Ocupación final</p>
              <p class="big-val mono" :style="{ color: statusColor(simResult.status) }">
                {{ simResult.finalOccupancy.toFixed(1) }}<small>%</small>
              </p>
            </div>
            <div class="sim-metric card">
              <p class="label">Pico proyectado</p>
              <p class="big-val mono">{{ simResult.peakOccupancy.toFixed(1) }}<small>%</small></p>
              <p class="metric-sub">en ~{{ simResult.peakTime.toFixed(0) }}h</p>
            </div>
            <div class="sim-metric card">
              <p class="label">Camas disponibles</p>
              <p class="big-val mono" style="color: var(--status-normal)">
                {{ Math.max(0, selectedHospital.capacity - selectedHospital.currentPatients) }}
              </p>
              <p class="metric-sub">de {{ selectedHospital.capacity }} total</p>
            </div>
          </div>

          <AlertBanner v-if="simResult.alert" :alert="simResult.alert" :status="simResult.status" />

          <div class="chart-wrap-sim" v-if="simResult.points.length > 1">
            <OccupancyChart :points="simResult.points" :horizon="horizon" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Mapa de ubicación del hospital ─────────────────── -->
    <Transition name="slide-up">
      <div v-if="selectedHospital" class="location-panel card" ref="locationPanelRef">
        <!-- Header del mapa -->
        <div class="location-header">
          <div class="location-title-wrap">
            <div class="location-icon" :style="{ background: typeColors[selectedHospital.type] }">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
              </svg>
            </div>
            <div>
              <h3 class="location-title">Ubicación del hospital</h3>
              <p class="location-sub">
                {{ selectedHospital.name }} · {{ selectedHospital.city }}
              </p>
            </div>
          </div>
          <!-- Coordenadas -->
          <div class="coords-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span class="mono coords-text">
              {{ selectedHospital.lat.toFixed(4) }}°N, {{ Math.abs(selectedHospital.lng).toFixed(4) }}°O
            </span>
          </div>
        </div>

        <!-- Contenedor del mapa -->
        <div class="location-map-wrap">
          <div ref="locationMapContainer" class="location-map"></div>

          <!-- Fallback sin token de Mapbox -->
          <div v-if="!locationMapReady" class="location-fallback">
            <div class="fallback-content">
              <div class="fallback-pin" :style="{ background: typeColors[selectedHospital.type] }">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
                </svg>
              </div>
              <p class="fallback-hosp-name">{{ selectedHospital.name }}</p>
              <p class="fallback-city">{{ selectedHospital.city }}</p>
              <div class="fallback-coords mono">
                {{ selectedHospital.lat.toFixed(5) }}, {{ selectedHospital.lng.toFixed(5) }}
              </div>
              <p class="fallback-hint">
                Agrega tu token de Mapbox en <code>.env</code> para ver el mapa interactivo
              </p>
              <!-- Enlace a Google Maps como alternativa -->
              <a
                :href="`https://www.google.com/maps?q=${selectedHospital.lat},${selectedHospital.lng}`"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-open-maps"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Ver en Google Maps
              </a>
            </div>
          </div>

          <!-- Overlay de info sobre el mapa (visible cuando Mapbox está listo) -->
          <div v-if="locationMapReady" class="map-info-overlay">
            <div class="map-info-card">
              <div class="map-info-dot" :style="{ background: typeColors[selectedHospital.type] }"></div>
              <div>
                <p class="map-info-name">{{ selectedHospital.name }}</p>
                <p class="map-info-city">{{ selectedHospital.city }} · {{ selectedHospital.type }}</p>
              </div>
            </div>
            <a
              :href="`https://www.google.com/maps?q=${selectedHospital.lat},${selectedHospital.lng}`"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-maps-overlay"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Maps
            </a>
          </div>
        </div>

        <!-- Info rápida bajo el mapa -->
        <div class="location-info-row">
          <div class="loc-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <span class="loc-info-label">Tipo</span>
            <span class="loc-info-val" :style="{ color: typeColors[selectedHospital.type] }">{{ selectedHospital.type }}</span>
          </div>
          <div class="loc-info-divider"></div>
          <div class="loc-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span class="loc-info-label">Pacientes actuales</span>
            <span class="loc-info-val mono">{{ selectedHospital.currentPatients }}</span>
          </div>
          <div class="loc-info-divider"></div>
          <div class="loc-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span class="loc-info-label">Ocupación actual</span>
            <span class="loc-info-val mono" :style="{ color: occColor(selectedHospital) }">
              {{ hospitalOccupancy(selectedHospital).toFixed(1) }}%
            </span>
          </div>
          <div class="loc-info-divider"></div>
          <div class="loc-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span class="loc-info-label">Capacidad total</span>
            <span class="loc-info-val mono">{{ selectedHospital.capacity }} camas</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import OccupancyChart from '@/components/OccupancyChart.vue'
import { HOSPITALS, hospitalOccupancy, type Hospital } from '@/services/hospitals'
import { runSimulation, statusColor } from '@/models/occupancyModel'
import type { SimulationResult, OccupancyStatus } from '@/models/occupancyModel'

// ── State ──────────────────────────────────────────────────
const searchQuery = ref('')
const activeFilter = ref('all')
const sortBy = ref('occupancy-asc')
const selectedId = ref<string | null>(null)
const selectedHospital = ref<Hospital | null>(null)
const simResult = ref<SimulationResult | null>(null)
const horizon = ref(24)

// Refs para el mapa de ubicación
const locationMapContainer = ref<HTMLDivElement | null>(null)
const locationPanelRef = ref<HTMLElement | null>(null)
const locationMapReady = ref(false)
let locationMapInstance: any = null
let locationMarker: any = null

// ── Constants ──────────────────────────────────────────────
const typeColors: Record<Hospital['type'], string> = {
  IMSS: '#3b82f6',
  ISSSTE: '#8b5cf6',
  SSA: '#10b981',
  Privado: '#f59e0b',
}

const filters = [
  { label: 'Todos', value: 'all', color: '#94a3b8' },
  { label: 'IMSS', value: 'IMSS', color: '#3b82f6' },
  { label: 'ISSSTE', value: 'ISSSTE', color: '#8b5cf6' },
  { label: 'SSA', value: 'SSA', color: '#10b981' },
  { label: 'Privado', value: 'Privado', color: '#f59e0b' },
]

const horizons = [
  { label: 'Ahora', value: 0 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
  { label: '72h', value: 72 },
]

// ── Helpers ────────────────────────────────────────────────
function occColor(h: Hospital): string {
  const pct = hospitalOccupancy(h)
  if (pct < 75) return '#10b981'
  if (pct < 85) return '#f59e0b'
  if (pct < 95) return '#f97316'
  return '#ef4444'
}

function occStatus(h: Hospital): OccupancyStatus {
  const pct = hospitalOccupancy(h)
  if (pct < 75) return 'normal'
  if (pct < 85) return 'alto'
  if (pct < 95) return 'saturado'
  return 'colapso'
}

// ── Computed ───────────────────────────────────────────────
const filteredHospitals = computed(() => {
  let list = [...HOSPITALS]
  if (activeFilter.value !== 'all') {
    list = list.filter(h => h.type === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q)
    )
  }
  return list
})

const sortedHospitals = computed(() => {
  return [...filteredHospitals.value].sort((a, b) => {
    if (sortBy.value === 'occupancy-asc') return hospitalOccupancy(a) - hospitalOccupancy(b)
    if (sortBy.value === 'occupancy-desc') return hospitalOccupancy(b) - hospitalOccupancy(a)
    if (sortBy.value === 'capacity') return b.capacity - a.capacity
    return a.name.localeCompare(b.name)
  })
})

const bestHospital = computed((): Hospital | null => {
  const avail = filteredHospitals.value.filter(h => hospitalOccupancy(h) < 85)
  if (!avail.length) return null
  return avail.reduce((best, h) =>
    hospitalOccupancy(h) < hospitalOccupancy(best) ? h : best
  )
})

// ── Mapa de ubicación ──────────────────────────────────────
async function initLocationMap(hospital: Hospital) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  if (!token) return

  // Si ya hay un mapa, simplemente volar al nuevo hospital
  if (locationMapInstance) {
    locationMapInstance.flyTo({
      center: [hospital.lng, hospital.lat],
      zoom: 14,
      duration: 1200,
      essential: true,
    })
    // Mover el marcador
    if (locationMarker) {
      locationMarker.setLngLat([hospital.lng, hospital.lat])
    }
    return
  }

  // Esperar a que el DOM esté listo
  await nextTick()
  if (!locationMapContainer.value) return

  try {
    const mapboxgl = (await import('mapbox-gl')).default
    await import('mapbox-gl/dist/mapbox-gl.css')

    mapboxgl.accessToken = token

    locationMapInstance = new mapboxgl.Map({
      container: locationMapContainer.value,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [hospital.lng, hospital.lat],
      zoom: 14,
    })

    locationMapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
    locationMapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    locationMapInstance.on('load', () => {
      // Marcador personalizado
      const el = document.createElement('div')
      const color = typeColors[hospital.type]
      el.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 4px 16px ${color}88, 0 0 0 6px ${color}33;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `

      // Cruz de hospital dentro del marcador
      const inner = document.createElement('div')
      inner.style.cssText = `
        width: 14px;
        height: 14px;
        transform: rotate(45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      `
      inner.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
        <path d="M12 5v14M5 12h14"/>
      </svg>`
      el.appendChild(inner)

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '240px',
      }).setHTML(`
        <div style="font-family:'DM Sans',sans-serif; padding:6px; min-width:200px">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
            <div style="width:10px; height:10px; border-radius:50%; background:${color}; flex-shrink:0; box-shadow: 0 0 6px ${color}"></div>
            <span style="font-size:11px; font-weight:700; color:#60a5fa; text-transform:uppercase; letter-spacing:0.05em">${hospital.type}</span>
          </div>
          <p style="font-weight:700; font-size:14px; color:#e2e8f0; margin:0 0 4px; line-height:1.3">${hospital.name}</p>
          <p style="font-size:12px; color:#94a3b8; margin:0 0 10px">${hospital.city}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px">
            <div style="background:rgba(59,130,246,0.1); padding:6px 8px; border-radius:6px; border:1px solid rgba(59,130,246,0.2)">
              <p style="font-size:10px; color:#64748b; margin:0 0 2px; text-transform:uppercase; letter-spacing:0.05em">Capacidad</p>
              <p style="font-size:14px; font-weight:700; color:#e2e8f0; margin:0; font-family:'Space Mono',monospace">${hospital.capacity}</p>
            </div>
            <div style="background:rgba(59,130,246,0.1); padding:6px 8px; border-radius:6px; border:1px solid rgba(59,130,246,0.2)">
              <p style="font-size:10px; color:#64748b; margin:0 0 2px; text-transform:uppercase; letter-spacing:0.05em">Ocupación</p>
              <p style="font-size:14px; font-weight:700; color:${occColor(hospital)}; margin:0; font-family:'Space Mono',monospace">${hospitalOccupancy(hospital).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      `)

      locationMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([hospital.lng, hospital.lat])
        .setPopup(popup)
        .addTo(locationMapInstance)

      // Abrir popup automáticamente
      locationMarker.togglePopup()

      locationMapReady.value = true
    })
  } catch (e) {
    console.warn('[Mapbox Location] No se pudo inicializar:', e)
  }
}

function destroyLocationMap() {
  if (locationMapInstance) {
    locationMapInstance.remove()
    locationMapInstance = null
    locationMarker = null
    locationMapReady.value = false
  }
}

// Observar cambios en hospital seleccionado para actualizar el mapa
watch(selectedHospital, async (hospital) => {
  if (!hospital) {
    destroyLocationMap()
    return
  }
  await nextTick()
  await initLocationMap(hospital)
})

onUnmounted(() => {
  destroyLocationMap()
})

// ── Actions ────────────────────────────────────────────────
function selectHospital(h: Hospital) {
  selectedId.value = h.id
  selectedHospital.value = h
  runSim(horizon.value)
  setTimeout(() => {
    document.querySelector('.sim-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

function runSim(h: number) {
  horizon.value = h
  if (!selectedHospital.value) return
  simResult.value = runSimulation(
    {
      currentPatients: selectedHospital.value.currentPatients,
      dailyAdmissions: selectedHospital.value.dailyAdmissions,
      dailyDischarges: selectedHospital.value.dailyDischarges,
      capacity: selectedHospital.value.capacity,
    },
    h,
  )
}
</script>

<style scoped>
/* ── Base ────────────────────────────────────────────────── */
.user-view { padding: 2rem; }

/* ── Header ───────────────────────────────────────────────── */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }

.search-bar-wrap {
  position: relative; display: flex; align-items: center;
  min-width: 280px;
}
.search-icon { position: absolute; left: 0.9rem; color: var(--text-muted); pointer-events: none; }
.search-input {
  width: 100%; padding: 0.55rem 0.9rem 0.55rem 2.3rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-primary);
  font-family: var(--font-body); font-size: 0.85rem; outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--text-muted); }

/* ── Filtros ──────────────────────────────────────────────── */
.filters-row {
  display: flex; align-items: center; gap: 0.75rem;
  flex-wrap: wrap; margin-bottom: 1.25rem;
}

.filters-scroll {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}

.filter-btn {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: 100px; color: var(--text-secondary);
  font-size: 0.78rem; font-family: var(--font-body); cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.filter-btn:hover { border-color: var(--border-strong); }
.filter-btn.active {
  background: var(--accent-glow); border-color: var(--accent);
  color: var(--text-accent); font-weight: 600;
}
.filter-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.filter-sort { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; }
.sort-label { white-space: nowrap; }
.sort-select {
  padding: 0.3rem 0.6rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-secondary);
  font-size: 0.78rem; outline: none; cursor: pointer;
}

/* ── Recomendación ────────────────────────────────────────── */
.recommendation-banner {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.85rem 1.2rem; margin-bottom: 1.25rem;
  background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.25);
  flex-wrap: wrap;
}
.rec-badge {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--status-normal);
  background: rgba(16,185,129,0.15); padding: 0.3rem 0.65rem;
  border-radius: 100px; white-space: nowrap;
}
.rec-info { flex: 1; min-width: 0; }
.rec-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.rec-meta { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.1rem; }
.btn-go-best {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.9rem; background: rgba(16,185,129,0.15);
  border: 1px solid rgba(16,185,129,0.35); border-radius: var(--radius-sm);
  color: var(--status-normal); font-size: 0.8rem; font-weight: 600;
  font-family: var(--font-body); cursor: pointer; transition: all 0.15s;
  white-space: nowrap;
}
.btn-go-best:hover { background: rgba(16,185,129,0.25); }

/* ── Grid hospitales ─────────────────────────────────────── */
.hospitals-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem; margin-bottom: 1.5rem;
}

.hospital-card {
  cursor: pointer; text-align: left; transition: all 0.2s;
  border-color: var(--border);
}
.hospital-card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
.hospital-card.selected { border-color: var(--accent); background: rgba(59,130,246,0.06); }

.hosp-card-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem;
}
.type-pill {
  font-size: 0.62rem; font-weight: 700; padding: 0.15rem 0.5rem;
  border-radius: 100px; border: 1px solid;
}
.hosp-city-tag { font-size: 0.7rem; color: var(--text-muted); }
.hosp-card-name {
  font-size: 0.875rem; font-weight: 600; color: var(--text-primary);
  line-height: 1.3; margin-bottom: 0.85rem;
}

.occ-display { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.85rem; }

.occ-ring-wrap { position: relative; width: 56px; height: 56px; flex-shrink: 0; }
.occ-pct {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700;
}
.occ-pct small { font-size: 0.55rem; opacity: 0.7; }

.occ-stats { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
.occ-stat { display: flex; justify-content: space-between; align-items: center; }
.occ-label { font-size: 0.68rem; color: var(--text-muted); }
.occ-val { font-size: 0.78rem; font-weight: 600; color: var(--text-primary); }

.hosp-status-row { display: flex; justify-content: space-between; align-items: center; }
.select-hint { font-size: 0.7rem; color: var(--text-muted); }
.selected-hint { font-size: 0.7rem; color: var(--accent); font-weight: 600; }

/* ── Panel Simulación ────────────────────────────────────── */
.sim-panel { margin-bottom: 1.5rem; padding: 0; overflow: hidden; }

.sim-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
  flex-wrap: wrap; gap: 0.75rem;
}
.sim-hosp-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
.sim-pin {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.sim-title {
  font-size: 0.9rem; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sim-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }

.sim-horizons { display: flex; gap: 0.35rem; flex-shrink: 0; }
.h-btn {
  padding: 0.35rem 0.75rem; background: var(--bg-input);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-secondary); font-family: var(--font-mono);
  font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
}
.h-btn:hover { border-color: var(--accent); color: var(--text-accent); }
.h-btn.active {
  background: var(--accent-glow); border-color: var(--accent);
  color: var(--text-accent); font-weight: 700;
}

.sim-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

.sim-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.sim-metric { padding: 0.85rem 1rem; }
.big-val { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-top: 0.4rem; }
.big-val small { font-size: 0.9rem; color: var(--text-secondary); }
.metric-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }

.chart-wrap-sim { height: 250px; }

/* ════════════════════════════════════════════════════════════
   PANEL DE UBICACIÓN (nuevo)
   ════════════════════════════════════════════════════════════ */

.location-panel {
  margin-bottom: 2rem;
  padding: 0;
  overflow: hidden;
}

/* ── Header del panel de ubicación ──────────────────────── */
.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.75rem;
}

.location-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.location-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.location-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.location-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
}

.coords-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 100px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.coords-text {
  font-size: 0.68rem;
}

/* ── Contenedor del mapa ─────────────────────────────────── */
.location-map-wrap {
  position: relative;
  width: 100%;
  height: 400px;
  background: var(--bg-input);
  overflow: hidden;
}

.location-map {
  width: 100%;
  height: 100%;
}

/* ── Fallback sin Mapbox ─────────────────────────────────── */
.location-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, var(--bg-input) 70%);
}

.fallback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
  padding: 2rem;
  max-width: 320px;
}

.fallback-pin {
  width: 52px;
  height: 52px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  margin-bottom: 0.5rem;
}

.fallback-pin svg {
  transform: rotate(45deg);
}

.fallback-hosp-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.fallback-city {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.fallback-coords {
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 0.3rem 0.75rem;
  border-radius: 100px;
}

.fallback-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 0.25rem;
}

.fallback-hint code {
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.btn-open-maps {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--accent-glow);
  border: 1px solid rgba(59,130,246,0.4);
  border-radius: var(--radius-sm);
  color: var(--text-accent);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-body);
  text-decoration: none;
  transition: all 0.15s;
  margin-top: 0.25rem;
}
.btn-open-maps:hover {
  background: rgba(59,130,246,0.2);
  border-color: var(--accent);
}

/* ── Overlay info sobre el mapa (cuando Mapbox está listo) ── */
.map-info-overlay {
  position: absolute;
  bottom: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.map-info-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.85rem;
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.map-info-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  50% { opacity: 0.7; }
}

.map-info-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.map-info-city {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
}

.btn-maps-overlay {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-accent);
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-body);
  text-decoration: none;
  transition: all 0.15s;
}
.btn-maps-overlay:hover {
  background: var(--accent-glow);
  border-color: var(--accent);
}

/* ── Info row bajo el mapa ───────────────────────────────── */
.location-info-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.85rem 1.5rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0;
}

.loc-info-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 1rem;
  flex: 1;
  min-width: 120px;
  color: var(--text-muted);
}

.loc-info-item svg {
  flex-shrink: 0;
  color: var(--text-muted);
}

.loc-info-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.loc-info-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-left: auto;
}

.loc-info-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════ */

/* ── Tablet (768px - 1023px) ─────────────────────────────── */
@media (max-width: 1023px) {
  .user-view { padding: 1.5rem; }

  .hospitals-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .sim-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .sort-label { display: none; }

  /* Mapa de ubicación: un poco menos alto */
  .location-map-wrap { height: 340px; }

  /* Info row: 2 por fila */
  .loc-info-item:nth-child(n+6) { display: none; }
  .location-sub { max-width: 240px; }
}

/* ── Mobile (< 768px) ────────────────────────────────────── */
@media (max-width: 767px) {
  .user-view { padding: 1rem; }

  .page-header {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .page-title { font-size: 1.2rem; }
  .page-sub   { font-size: 0.8rem; }

  .search-bar-wrap {
    width: 100%;
    min-width: unset;
  }

  .filters-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filters-scroll {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.25rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .filters-scroll::-webkit-scrollbar { display: none; }

  .filter-sort {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
  .sort-label { display: none; }
  .sort-select { flex: 1; font-size: 0.8rem; }

  .hospitals-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .recommendation-banner {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
  .rec-title { font-size: 0.85rem; }
  .rec-meta  { font-size: 0.7rem; }
  .btn-go-best { font-size: 0.75rem; padding: 0.35rem 0.75rem; }

  .sim-header {
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
  }
  .sim-title { font-size: 0.85rem; }

  .sim-horizons {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.35rem;
  }
  .h-btn { text-align: center; padding: 0.4rem 0.3rem; font-size: 0.75rem; }

  .sim-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem;
  }
  .sim-metric { padding: 0.75rem; }
  .big-val { font-size: 1.5rem; }

  .sim-body { padding: 1rem; }
  .chart-wrap-sim { height: 210px; }

  /* ── Mapa de ubicación: móvil ────────────────────────────── */
  .location-header {
    padding: 0.9rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .location-title { font-size: 0.85rem; }
  .location-sub { font-size: 0.68rem; max-width: 100%; }

  /* Coordenadas: texto más compacto */
  .coords-badge { padding: 0.25rem 0.55rem; }
  .coords-text  { font-size: 0.62rem; }

  /* Mapa más bajo en móvil */
  .location-map-wrap { height: 260px; }

  /* Overlay info: solo nombre */
  .map-info-city { display: none; }
  .map-info-name { font-size: 0.75rem; }

  /* Info row: apilar en 2 columnas */
  .location-info-row {
    padding: 0.75rem 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .loc-info-divider { display: none; }

  .loc-info-item {
    padding: 0.5rem 0.6rem;
    flex: unset;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    gap: 0.35rem;
    min-width: unset;
  }

  .loc-info-val {
    margin-left: auto;
    font-size: 0.78rem;
  }

  /* Fallback más compacto */
  .fallback-content {
    padding: 1.5rem 1rem;
    gap: 0.45rem;
  }
  .fallback-pin { width: 44px; height: 44px; }
  .fallback-hosp-name { font-size: 0.9rem; }
  .fallback-hint { font-size: 0.68rem; }
  .btn-open-maps { font-size: 0.75rem; padding: 0.45rem 0.85rem; }
}

/* ── Muy pequeño (< 480px) ───────────────────────────────── */
@media (max-width: 479px) {
  .sim-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .occ-ring-wrap { width: 48px; height: 48px; }
  .occ-ring-wrap svg { width: 48px; height: 48px; }
  .occ-pct { font-size: 0.75rem; }
  .hosp-card-name { font-size: 0.82rem; }
  .page-title { font-size: 1.1rem; }

  /* Mapa: altura mínima usable */
  .location-map-wrap { height: 220px; }

  /* Info row: 1 columna en pantallas muy pequeñas */
  .location-info-row {
    grid-template-columns: 1fr;
  }
}
</style>