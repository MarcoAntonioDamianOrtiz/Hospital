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
        <span class="label sort-label">Ordenar:</span>
        <select v-model="sortBy" class="sort-select">
          <option value="occupancy-asc">Menor ocupación</option>
          <option value="occupancy-desc">Mayor ocupación</option>
          <option value="capacity">Mayor capacidad</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
    </div>

    <!-- ── Recomendación del sistema ─────────────────────── -->
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
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }

.search-bar-wrap { position: relative; display: flex; align-items: center; min-width: 280px; }
.search-icon { position: absolute; left: 0.9rem; color: var(--text-muted); pointer-events: none; }
.search-input {
  width: 100%; padding: 0.55rem 0.9rem 0.55rem 2.3rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-primary);
  font-family: var(--font-body); font-size: 0.85rem; outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--text-muted); }

/* ── Filtros ──────────────────────────────────────────────── */
.filters-row {
  display: flex; align-items: center; gap: 0.75rem;
  flex-wrap: wrap; margin-bottom: 1.25rem;
}
.filters-scroll { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
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
  padding: 0.3rem 0.6rem; background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-secondary); font-size: 0.78rem; outline: none; cursor: pointer;
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
  font-family: var(--font-body); cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-go-best:hover { background: rgba(16,185,129,0.25); }

/* ── Grid hospitales ─────────────────────────────────────── */
.hospitals-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem; margin-bottom: 1.5rem;
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 1023px) {
  .user-view { padding: 1.5rem; }
  .sort-label { display: none; }
}

@media (max-width: 767px) {
  .user-view { padding: 1rem; }
  .page-header { flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
  .page-title { font-size: 1.2rem; }
  .page-sub   { font-size: 0.8rem; }
  .search-bar-wrap { width: 100%; min-width: unset; }

  .filters-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; margin-bottom: 1rem; }
  .filters-scroll {
    width: 100%; overflow-x: auto; flex-wrap: nowrap;
    padding-bottom: 0.25rem; -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .filters-scroll::-webkit-scrollbar { display: none; }
  .filter-sort { margin-left: 0; width: 100%; justify-content: flex-start; }
  .sort-label { display: none; }
  .sort-select { flex: 1; font-size: 0.8rem; }

  .hospitals-grid { grid-template-columns: 1fr; gap: 0.75rem; }
  .recommendation-banner { padding: 0.75rem 1rem; gap: 0.75rem; }
  .rec-title { font-size: 0.85rem; }
  .rec-meta  { font-size: 0.7rem; }
  .btn-go-best { font-size: 0.75rem; padding: 0.35rem 0.75rem; }
}

@media (max-width: 479px) {
  .page-title { font-size: 1.1rem; }
}
</style>