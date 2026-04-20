<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Dashboard de Predicción</h1>
        <p class="page-sub">Proyección de capacidad hospitalaria en tiempo real</p>
      </div>
      <div class="header-time mono">{{ currentTime }}</div>
    </header>

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
import { runSimulation, statusColor } from '@/models/occupancyModel'
import type { SimulationResult } from '@/models/occupancyModel'
import { useHistory } from '@/composables/useHistory'

const { addEntry } = useHistory()

const form = ref({
  patients: 120,
  admissions: 45,
  discharges: 40,
  capacity: 200,
})

const selectedHorizon = ref(24)
const result = ref<SimulationResult | null>(null)

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

// Clock
const currentTime = ref('')
let clockInterval: ReturnType<typeof setInterval>
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function simulate() {
  result.value = runSimulation(
    {
      currentPatients: form.value.patients,
      dailyAdmissions: form.value.admissions,
      dailyDischarges: form.value.discharges,
      capacity: form.value.capacity,
    },
    selectedHorizon.value
  )
  addEntry(form.value.patients, form.value.admissions, form.value.discharges, selectedHorizon.value, result.value)
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
  margin-bottom: 2rem;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }
.header-time { font-size: 0.8rem; color: var(--text-muted); padding-top: 0.3rem; }

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

/* Horizon buttons */
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
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px var(--accent-glow);
}
.btn-simulate:hover { background: #2563eb; transform: translateY(-1px); }
.btn-simulate:active { transform: none; }

/* Results column */
.results-col { display: flex; flex-direction: column; gap: 1rem; }

.status-row {}
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

/* Chart */
.chart-panel {}
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; padding: 3rem; text-align: center;
  color: var(--text-muted);
}
.empty-icon { opacity: 0.3; }
</style>
