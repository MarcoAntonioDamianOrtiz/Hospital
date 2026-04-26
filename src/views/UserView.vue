<template>
  <div class="user-view">
    <!-- ── Header ────────────────────────────────────────── -->
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

    <!-- ── Filtros rápidos ───────────────────────────────── -->
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
        <select v-model="sortBy" class="sort-select">
          <option value="occupancy-asc">↑ Menor ocupación</option>
          <option value="occupancy-desc">↓ Mayor ocupación</option>
          <option value="capacity">Mayor capacidad</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
    </div>

    <!-- ── Recomendación del sistema ─────────────────────── -->
    <Transition name="slide-up">
      <div v-if="bestHospital" class="recommendation-banner card">
        <div class="rec-left">
          <div class="rec-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
        </div>
        <button class="btn-go-best" @click="selectHospital(bestHospital)">
          Ver detalles
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- ── Contador de resultados ────────────────────────── -->
    <div class="results-count" v-if="sortedHospitals.length">
      <span class="label">{{ sortedHospitals.length }} hospital{{ sortedHospitals.length !== 1 ? 'es' : '' }} encontrado{{ sortedHospitals.length !== 1 ? 's' : '' }}</span>
    </div>
    <div class="results-count empty-msg" v-else>
      <span class="label">Sin resultados para "{{ searchQuery }}"</span>
    </div>

    <!-- ── Grid de tarjetas ──────────────────────────────── -->
    <div class="hospitals-grid">
      <HospitalCard
        v-for="h in sortedHospitals"
        :key="h.id"
        :hospital="h"
        :is-selected="selectedId === h.id"
        @select="selectHospital"
      />
    </div>

    <!-- ── Panel de simulación ───────────────────────────── -->
    <Transition name="slide-up">
      <HospitalSimPanel
        v-if="selectedHospital"
        :hospital="selectedHospital"
        :horizon="horizon"
        :result="simResult"
        @run="runSim"
      />
    </Transition>

    <!-- ── Mapa de ubicación ─────────────────────────────── -->
    <Transition name="slide-up">
      <HospitalLocationMap
        v-if="selectedHospital"
        :hospital="selectedHospital"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HospitalCard from '@/components/HospitalCard.vue'
import HospitalSimPanel from '@/components/HospitalSimPanel.vue'
import HospitalLocationMap from '@/components/HospitalLocationMap.vue'
import { HOSPITALS, hospitalOccupancy, type Hospital } from '@/services/hospitals'
import { runSimulation } from '@/models/occupancyModel'
import type { SimulationResult } from '@/models/occupancyModel'

// ── Estado ────────────────────────────────────────────────
const searchQuery  = ref('')
const activeFilter = ref('all')
const sortBy       = ref('occupancy-asc')
const selectedId   = ref<string | null>(null)
const selectedHospital = ref<Hospital | null>(null)
const simResult    = ref<SimulationResult | null>(null)
const horizon      = ref(24)

// ── Filtros disponibles ───────────────────────────────────
const filters = [
  { label: 'Todos',   value: 'all',     color: '#94a3b8' },
  { label: 'IMSS',    value: 'IMSS',    color: '#3b82f6' },
  { label: 'ISSSTE',  value: 'ISSSTE',  color: '#8b5cf6' },
  { label: 'SSA',     value: 'SSA',     color: '#10b981' },
  { label: 'Privado', value: 'Privado', color: '#f59e0b' },
]

// ── Listas filtradas y ordenadas ──────────────────────────
const filteredHospitals = computed(() => {
  let list = [...HOSPITALS]
  if (activeFilter.value !== 'all')
    list = list.filter(h => h.type === activeFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(h =>
      h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
    )
  }
  return list
})

const sortedHospitals = computed(() => {
  return [...filteredHospitals.value].sort((a, b) => {
    if (sortBy.value === 'occupancy-asc')  return hospitalOccupancy(a) - hospitalOccupancy(b)
    if (sortBy.value === 'occupancy-desc') return hospitalOccupancy(b) - hospitalOccupancy(a)
    if (sortBy.value === 'capacity')       return b.capacity - a.capacity
    return a.name.localeCompare(b.name)
  })
})

const bestHospital = computed((): Hospital | null => {
  const avail = filteredHospitals.value.filter(h => hospitalOccupancy(h) < 85)
  if (!avail.length) return null
  return avail.reduce((best, h) => hospitalOccupancy(h) < hospitalOccupancy(best) ? h : best)
})

// ── Acciones ──────────────────────────────────────────────
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
      currentPatients:  selectedHospital.value.currentPatients,
      dailyAdmissions:  selectedHospital.value.dailyAdmissions,
      dailyDischarges:  selectedHospital.value.dailyDischarges,
      capacity:         selectedHospital.value.capacity,
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }

.search-bar-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 280px;
}
.search-icon {
  position: absolute;
  left: 0.9rem;
  color: var(--text-muted);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 0.55rem 0.9rem 0.55rem 2.3rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--text-muted); }

/* ── Filtros ──────────────────────────────────────────────── */
.filters-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.filters-scroll {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px; /* prevent clipping */
}
.filters-scroll::-webkit-scrollbar { display: none; }

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 100px;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.filter-btn:hover { border-color: var(--border-strong); }
.filter-btn.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--text-accent);
  font-weight: 600;
}
.filter-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.filter-sort { flex-shrink: 0; }
.sort-select {
  padding: 0.35rem 0.7rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-family: var(--font-body);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.sort-select:focus { border-color: var(--accent); }

/* ── Recomendación ────────────────────────────────────────── */
.recommendation-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.2rem;
  margin-bottom: 1rem;
  background: rgba(16,185,129,0.06);
  border-color: rgba(16,185,129,0.25);
  flex-wrap: wrap;
}
.rec-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}
.rec-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--status-normal);
  background: rgba(16,185,129,0.15);
  padding: 0.25rem 0.6rem;
  border-radius: 100px;
  white-space: nowrap;
  flex-shrink: 0;
}
.rec-info { flex: 1; min-width: 0; }
.rec-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rec-meta { font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.1rem; }
.btn-go-best {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  background: rgba(16,185,129,0.15);
  border: 1px solid rgba(16,185,129,0.35);
  border-radius: var(--radius-sm);
  color: var(--status-normal);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-go-best:hover { background: rgba(16,185,129,0.25); }

/* ── Contador ─────────────────────────────────────────────── */
.results-count {
  margin-bottom: 0.75rem;
}
.empty-msg { color: var(--text-muted); }

/* ── Grid hospitales ─────────────────────────────────────── */
.hospitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════ */

/* ── Tablet (768px - 1023px) ─────────────────────────────── */
@media (max-width: 1023px) {
  .user-view { padding: 1.5rem; }
  .hospitals-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ── Mobile (< 768px) ────────────────────────────────────── */
@media (max-width: 767px) {
  .user-view { padding: 0.85rem; }

  /* Header: apilado en columna */
  .page-header {
    flex-direction: column;
    gap: 0.65rem;
    margin-bottom: 0.85rem;
  }
  .page-title { font-size: 1.2rem; }
  .page-sub { font-size: 0.78rem; }

  /* Buscador ocupa todo el ancho */
  .search-bar-wrap {
    width: 100%;
    min-width: unset;
  }
  .search-input { font-size: 0.9rem; padding: 0.6rem 0.9rem 0.6rem 2.3rem; }

  /* Filtros: scroll horizontal + sort debajo */
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }
  .filters-scroll {
    /* Fuerza scroll horizontal sin wrap */
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }
  .filter-btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.75rem;
  }
  .filter-sort { width: 100%; }
  .sort-select { width: 100%; font-size: 0.85rem; padding: 0.45rem 0.7rem; }

  /* Recomendación: simplificada */
  .recommendation-banner {
    padding: 0.7rem 0.9rem;
    gap: 0.65rem;
  }
  .rec-left { gap: 0.5rem; }
  .rec-badge { font-size: 0.62rem; padding: 0.2rem 0.5rem; }
  .rec-title { font-size: 0.82rem; }
  .rec-meta { font-size: 0.68rem; }
  .btn-go-best { font-size: 0.75rem; padding: 0.35rem 0.7rem; }

  /* Grid: 1 columna */
  .hospitals-grid {
    grid-template-columns: 1fr;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }
}

/* ── Muy pequeño (< 480px) ───────────────────────────────── */
@media (max-width: 479px) {
  .user-view { padding: 0.75rem; }
  .page-title { font-size: 1.1rem; }

  /* En pantallas muy pequeñas la recomendación apila todo */
  .recommendation-banner { flex-direction: column; align-items: flex-start; }
  .btn-go-best { width: 100%; justify-content: center; }
}
</style>