<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Dashboard de Predicción</h1>
        <p class="page-sub">Proyección de capacidad hospitalaria en tiempo real</p>
      </div>
      <div class="header-right">
        <button class="btn-map" @click="showMapPicker = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
          </svg>
          Seleccionar hospital
        </button>
        <div class="header-time mono">{{ currentTime }}</div>
      </div>
    </header>

    <!-- Hospital activo banner -->
    <Transition name="slide-up">
      <div v-if="activeHospital" class="hospital-banner card">
        <div class="hosp-banner-left">
          <div class="hosp-pin" :style="{ background: typeColors[activeHospital.type] }">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
            </svg>
          </div>
          <div>
            <p class="hosp-name">{{ activeHospital.name }}</p>
            <p class="hosp-meta">{{ activeHospital.city }} · {{ activeHospital.type }} · {{ activeHospital.capacity }} camas</p>
          </div>
        </div>
        <button class="btn-clear-hosp" @click="clearHospital">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Quitar
        </button>
      </div>
    </Transition>

    <!-- Mapa modal -->
    <Transition name="fade">
      <div v-if="showMapPicker" class="map-overlay" @click.self="showMapPicker = false">
        <div class="map-modal">
          <MapboxHospitalPicker
            @select="onHospitalSelected"
            @close="showMapPicker = false"
          />
        </div>
      </div>
    </Transition>

    <div class="dashboard-grid">
      <!-- ── Columna izquierda: formulario ── -->
      <section class="panel form-panel card">
        <h2 class="panel-title">Parámetros del Hospital</h2>

        <div class="form-group">
          <label class="label">Pacientes actuales</label>
          <div class="input-wrap">
            <input
              v-model.number="form.patients"
              type="number" min="0" max="500"
              class="input"
              @input="autoSimulate"
            />
            <span class="input-suffix">pac.</span>
          </div>
        </div>

        <div class="form-group">
          <label class="label">Ingresos diarios promedio</label>
          <div class="input-wrap">
            <input
              v-model.number="form.admissions"
              type="number" min="0" max="500"
              class="input"
              @input="autoSimulate"
            />
            <span class="input-suffix">/día</span>
          </div>
        </div>

        <div class="form-group">
          <label class="label">Altas diarias promedio</label>
          <div class="input-wrap">
            <input
              v-model.number="form.discharges"
              type="number" min="0" max="500"
              class="input"
              @input="autoSimulate"
            />
            <span class="input-suffix">/día</span>
          </div>
        </div>

        <div class="form-group">
          <label class="label">Capacidad total del hospital</label>
          <div class="input-wrap">
            <input
              v-model.number="form.capacity"
              type="number" min="10" max="2000"
              class="input"
              @input="autoSimulate"
            />
            <span class="input-suffix">camas</span>
          </div>
        </div>

        <!-- Botones de horizonte temporal -->
        <div class="form-group">
          <label class="label">Horizonte de predicción</label>
          <div class="horizon-buttons">
            <button
              v-for="h in horizons"
              :key="h.value"
              class="horizon-btn"
              :class="{ active: selectedHorizon === h.value }"
              @click="selectHorizon(h.value)"
            >
              {{ h.label }}
            </button>
          </div>
        </div>

        <button class="btn-simulate" @click="simulate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Simular
        </button>

        <!-- Firebase status -->
        <div class="firebase-status" :class="{ active: isFirebaseEnabled }">
          <span class="firebase-dot"></span>
          <span>{{ isFirebaseEnabled ? 'Historial en la nube' : 'Historial local' }}</span>
        </div>
      </section>

      <!-- ── Columna derecha: resultados ── -->
      <div class="results-col">

        <!-- Estado actual -->
        <div class="status-row" v-if="result">
          <div class="status-main card">
            <p class="label">Estado proyectado</p>
            <div class="status-display">
              <StatusBadge :status="result.status" />
              <span class="occupancy-big mono">{{ result.finalOccupancy.toFixed(1) }}<small>%</small></span>
            </div>
            <p class="occupancy-desc">Ocupación al final del período</p>
          </div>
        </div>

        <!-- Métricas -->
        <div class="metrics-grid" v-if="result">
          <MetricCard
            label="Ocupación actual"
            :value="currentOccupancy.toFixed(1)"
            unit="%"
            :percent="currentOccupancy"
            :bar-color="barColor"
          />
          <MetricCard
            label="Pico proyectado"
            :value="result.peakOccupancy.toFixed(1)"
            unit="%"
            :sub="`en ~${result.peakTime.toFixed(0)}h`"
            :percent="result.peakOccupancy"
            :bar-color="barColor"
          />
          <MetricCard
            label="Tiempo de respuesta"
            :value="result.timeConstant.toFixed(1)"
            unit="h"
            sub="Velocidad de cambio del sistema"
          />
          <MetricCard
            label="Camas disponibles"
            :value="Math.max(0, form.capacity - form.patients)"
            unit="camas"
            :sub="`de ${form.capacity} total`"
          />
        </div>

        <!-- Alerta -->
        <AlertBanner v-if="result" :alert="result.alert" :status="result.status" />

        <!-- Gráfica -->
        <div class="chart-panel card" v-if="result && result.points.length > 0">
          <div class="chart-header">
            <h3 class="panel-title" style="margin:0">Evolución de la ocupación</h3>
            <span class="label">{{ horizonLabel }}</span>
          </div>
          <OccupancyChart :points="result.points" :horizon="selectedHorizon" />
        </div>

        <!-- Empty state -->
        <div v-if="!result" class="empty-state card">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p>Ingresa los datos del hospital y presiona <strong>Simular</strong></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import MetricCard from '@/components/MetricCard.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import OccupancyChart from '@/components/OccupancyChart.vue'
import MapboxHospitalPicker from '@/components/MapboxHospitalPicker.vue'
import { runSimulation, statusColor } from '@/models/occupancyModel'
import type { SimulationResult } from '@/models/occupancyModel'
import { useHistory } from '@/composables/useHistory'
import { type Hospital, hospitalTypeColor } from '@/services/hospitals'

const { addEntry, isFirebaseEnabled } = useHistory()

const form = ref({
  patients: 120,
  admissions: 45,
  discharges: 40,
  capacity: 200,
})

const selectedHorizon = ref(24)
const result = ref<SimulationResult | null>(null)
const showMapPicker = ref(false)
const activeHospital = ref<Hospital | null>(null)

const typeColors: Record<Hospital['type'], string> = {
  IMSS: '#3b82f6',
  ISSSTE: '#8b5cf6',
  SSA: '#10b981',
  Privado: '#f59e0b',
}

const horizons = [
  { label: 'Ahora', value: 0 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
  { label: '72h', value: 72 },
]

const horizonLabel = computed(() => {
  const h = horizons.find(x => x.value === selectedHorizon.value)
  return h ? `Proyección: ${h.label}` : ''
})

const currentOccupancy = computed(() =>
  Math.min((form.value.patients / form.value.capacity) * 100, 100)
)

const barColor = computed(() =>
  result.value ? statusColor(result.value.status) : '#3b82f6'
)

// ── Hospital desde el mapa ────────────────────────────────────────────────────
function onHospitalSelected(hospital: Hospital) {
  activeHospital.value = hospital
  form.value = {
    patients: hospital.currentPatients,
    admissions: hospital.dailyAdmissions,
    discharges: hospital.dailyDischarges,
    capacity: hospital.capacity,
  }
  showMapPicker.value = false
  simulate()
}

function clearHospital() {
  activeHospital.value = null
}

// ── Reloj ────────────────────────────────────────────────────────────────────
const currentTime = ref('')
let clockInterval: ReturnType<typeof setInterval>
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ── Simulación ───────────────────────────────────────────────────────────────
function simulate() {
  result.value = runSimulation(
    {
      currentPatients: form.value.patients,
      dailyAdmissions: form.value.admissions,
      dailyDischarges: form.value.discharges,
      capacity: form.value.capacity,
    },
    selectedHorizon.value,
  )
  addEntry(
    form.value.patients,
    form.value.admissions,
    form.value.discharges,
    selectedHorizon.value,
    result.value,
    form.value.capacity,
    activeHospital.value?.name,
    activeHospital.value?.id,
  )
}

function selectHorizon(h: number) {
  selectedHorizon.value = h
  simulate()
}

let debounceTimer: ReturnType<typeof setTimeout>
function autoSimulate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(simulate, 400)
}

onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
  simulate()
})

onUnmounted(() => clearInterval(clockInterval))
</script>

<style scoped>
.dashboard { padding: 2rem; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 1.25rem;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }
.header-right { display: flex; align-items: center; gap: 1rem; }
.header-time { font-size: 0.8rem; color: var(--text-muted); }

.btn-map {
  display: flex; align-items: center; gap: 0.45rem;
  padding: 0.45rem 0.9rem;
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-accent);
  font-size: 0.8rem; font-family: var(--font-body); font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-map:hover { background: var(--accent-glow); border-color: var(--accent); }

/* Hospital banner */
.hospital-banner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.1rem; margin-bottom: 1.25rem;
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.25);
}
.hosp-banner-left { display: flex; align-items: center; gap: 0.75rem; }
.hosp-pin {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.hosp-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
.hosp-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }
.btn-clear-hosp {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.65rem; background: transparent;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-muted); font-size: 0.72rem; cursor: pointer;
  transition: all 0.15s;
}
.btn-clear-hosp:hover { border-color: #ef4444; color: #ef4444; }

/* Map overlay */
.map-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(10,15,30,0.85); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem;
}
.map-modal {
  width: 100%; max-width: 960px;
  animation: pop-in 0.25s cubic-bezier(.16,1,.3,1);
}
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to   { opacity: 1; transform: none; }
}

/* Grid layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* Form */
.panel-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 1.2rem; color: var(--text-secondary); }

.form-group { margin-bottom: 1.1rem; }
.form-group .label { display: block; margin-bottom: 0.4rem; }

.input-wrap { position: relative; display: flex; align-items: center; }
.input {
  width: 100%; padding: 0.6rem 2.5rem 0.6rem 0.75rem;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.input-suffix {
  position: absolute; right: 0.65rem;
  font-size: 0.72rem; color: var(--text-muted); pointer-events: none;
}

.horizon-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
.horizon-btn {
  padding: 0.45rem 0;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}
.horizon-btn:hover { border-color: var(--accent); color: var(--text-accent); }
.horizon-btn.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--text-accent);
  font-weight: 700;
}

.btn-simulate {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.75rem;
  margin-top: 0.5rem;
  background: var(--accent);
  border: none; border-radius: var(--radius-sm);
  color: white; font-family: var(--font-body); font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 20px var(--accent-glow);
}
.btn-simulate:hover { background: #2563eb; transform: translateY(-1px); }
.btn-simulate:active { transform: none; }

/* Firebase status */
.firebase-status {
  display: flex; align-items: center; gap: 0.4rem;
  margin-top: 0.75rem; padding: 0.5rem 0.65rem;
  background: var(--bg-input); border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-size: 0.7rem; color: var(--text-muted);
}
.firebase-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-muted); flex-shrink: 0;
}
.firebase-status.active .firebase-dot {
  background: var(--status-normal);
  box-shadow: 0 0 5px var(--status-normal);
  animation: pulse 2s infinite;
}
.firebase-status.active { color: var(--text-secondary); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* Results column */
.results-col { display: flex; flex-direction: column; gap: 1rem; }

.status-main { display: flex; flex-direction: column; gap: 0.5rem; }
.status-display { display: flex; align-items: center; gap: 1rem; margin-top: 0.4rem; }
.occupancy-big {
  font-size: 2.5rem; font-weight: 700; color: var(--text-primary);
  margin-left: auto;
}
.occupancy-big small { font-size: 1rem; color: var(--text-secondary); }
.occupancy-desc { font-size: 0.75rem; color: var(--text-muted); }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.chart-panel {}
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; padding: 3rem; text-align: center;
  color: var(--text-muted);
}
.empty-icon { opacity: 0.3; }
</style>