<template>
  <div class="user-view">
    <header class="page-header">
      <div>
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
      <div class="filter-sort">
        <span class="label">Ordenar:</span>
        <select v-model="sortBy" class="sort-select">
          <option value="occupancy-asc">Menor ocupación primero</option>
          <option value="occupancy-desc">Mayor ocupación primero</option>
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
          <p class="rec-meta">{{ bestHospital.city }} · {{ bestHospital.type }} · <strong style="color: var(--status-normal)">{{ hospitalOccupancy(bestHospital).toFixed(0) }}% ocupación</strong></p>
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
            <span class="occ-pct mono" :style="{ color: occColor(h) }">{{ hospitalOccupancy(h).toFixed(0) }}<small>%</small></span>
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
                <circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
              </svg>
            </div>
            <div>
              <h3 class="sim-title">Simulación: {{ selectedHospital.name }}</h3>
              <p class="sim-meta">Datos preconfigurados por el administrador</p>
            </div>
          </div>
          <div class="sim-horizons">
            <button
              v-for="h in horizons" :key="h.value"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import OccupancyChart from '@/components/OccupancyChart.vue'
import { HOSPITALS, hospitalOccupancy, type Hospital } from '@/services/hospitals'
import { runSimulation, statusColor } from '@/models/occupancyModel'
import type { SimulationResult, OccupancyStatus } from '@/models/occupancyModel'

const searchQuery = ref('')
const activeFilter = ref('all')
const sortBy = ref('occupancy-asc')
const selectedId = ref<string | null>(null)
const selectedHospital = ref<Hospital | null>(null)
const simResult = ref<SimulationResult | null>(null)
const horizon = ref(24)

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

function occColor(h: Hospital): string {
  const pct = hospitalOccupancy(h)
  if (pct < 75) return '#10b981'
  if (pct < 85) return '#f59e0b'
  if (pct < 95) return '#f97316'
  return '#ef4444'
}

function occStatus(h: Hospital): OccupancyStatus { = computed(() => {
  let list = HOSPITALS
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

const bestHospital = computed(() => {
  const avail = filteredHospitals.value.filter(h => hospitalOccupancy(h) < 85)
  if (!avail.length) return null
  return avail.reduce((best, h) =>
    hospitalOccupancy(h) < hospitalOccupancy(best) ? h : best
  )
})

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
.user-view { padding: 2rem; }

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

.filters-row {
  display: flex; align-items: center; gap: 0.5rem;
  flex-wrap: wrap; margin-bottom: 1.25rem;
}
.filter-btn {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: 100px; color: var(--text-secondary);
  font-size: 0.78rem; font-family: var(--font-body); cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover { border-color: var(--border-strong); }
.filter-btn.active { background: var(--accent-glow); border-color: var(--accent); color: var(--text-accent); font-weight: 600; }
.filter-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.filter-sort { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
.filter-sort .label { white-space: nowrap; }
.sort-select {
  padding: 0.3rem 0.6rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-secondary);
  font-size: 0.78rem; outline: none; cursor: pointer;
}

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
.rec-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.rec-meta { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.1rem; }
.btn-go-best {
  margin-left: auto; display: flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.9rem; background: rgba(16,185,129,0.15);
  border: 1px solid rgba(16,185,129,0.35); border-radius: var(--radius-sm);
  color: var(--status-normal); font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.btn-go-best:hover { background: rgba(16,185,129,0.25); }

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
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;
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

/* Simulador panel */
.sim-panel { margin-bottom: 1.5rem; padding: 0; overflow: hidden; }

.sim-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
  flex-wrap: wrap; gap: 1rem;
}
.sim-hosp-info { display: flex; align-items: center; gap: 0.75rem; }
.sim-pin {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.sim-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.sim-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }

.sim-horizons { display: flex; gap: 0.35rem; }
.h-btn {
  padding: 0.35rem 0.75rem; background: var(--bg-input);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-secondary); font-family: var(--font-mono);
  font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
}
.h-btn:hover { border-color: var(--accent); color: var(--text-accent); }
.h-btn.active { background: var(--accent-glow); border-color: var(--accent); color: var(--text-accent); font-weight: 700; }

.sim-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

.sim-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.sim-metric { padding: 0.85rem 1rem; }
.big-val { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-top: 0.4rem; }
.big-val small { font-size: 0.9rem; color: var(--text-secondary); }
.metric-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }

.chart-wrap-sim { height: 250px; }
</style>