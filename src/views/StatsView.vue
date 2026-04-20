<template>
  <div class="stats-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Estadísticas e Historial</h1>
        <p class="page-sub">Registro de simulaciones y análisis de tendencias</p>
      </div>
      <button v-if="history.length" class="btn-clear" @click="clearHistory">
        Limpiar historial
      </button>
    </header>

    <!-- Empty state -->
    <div v-if="!history.length" class="empty-state card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <p>Aún no hay simulaciones registradas.<br/>Ve al Dashboard y ejecuta una predicción.</p>
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div class="summary-grid">
        <div class="card summary-card">
          <p class="label">Total de simulaciones</p>
          <p class="big-num mono">{{ history.length }}</p>
        </div>
        <div class="card summary-card">
          <p class="label">Ocupación promedio</p>
          <p class="big-num mono">{{ averageOccupancy.toFixed(1) }}<small>%</small></p>
        </div>
        <div class="card summary-card">
          <p class="label">Tendencia reciente</p>
          <p class="big-num" :class="trendClass">
            <span class="trend-arrow">{{ trendArrow }}</span>
            {{ trendLabel }}
          </p>
        </div>
        <div class="card summary-card">
          <p class="label">Distribución de estados</p>
          <div class="dist-bars">
            <div v-for="(count, key) in statusDistribution" :key="key" class="dist-item">
              <span class="dist-label">{{ getStatusLabel(key as OccupancyStatus) }}</span>
              <div class="dist-bar-wrap">
                <div class="dist-bar" :style="{ width: distWidth(count), background: distColor(key as OccupancyStatus) }"></div>
              </div>
              <span class="dist-count mono">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfica de historial -->
      <div class="card chart-section" v-if="history.length > 1">
        <h3 class="section-title">Evolución de ocupación por simulación</h3>
        <div class="chart-wrap">
          <Bar :data="historyChartData" :options="historyChartOptions" />
        </div>
      </div>

      <!-- Tabla de historial -->
      <div class="card table-section">
        <h3 class="section-title">Registro de simulaciones</h3>
        <div class="table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Horizonte</th>
                <th>Pacientes</th>
                <th>Ingresos/día</th>
                <th>Altas/día</th>
                <th>Ocupación final</th>
                <th>Pico</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in history" :key="entry.id">
                <td class="mono text-muted">{{ entry.timestamp }}</td>
                <td class="mono text-accent">{{ entry.horizon }}</td>
                <td class="mono">{{ entry.patients }}</td>
                <td class="mono">{{ entry.admissions }}</td>
                <td class="mono">{{ entry.discharges }}</td>
                <td class="mono">{{ entry.finalOccupancy.toFixed(1) }}%</td>
                <td class="mono">{{ entry.peakOccupancy.toFixed(1) }}%</td>
                <td>
                  <StatusBadge :status="entry.status" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import StatusBadge from '@/components/StatusBadge.vue'
import { useHistory } from '@/composables/useHistory'
import { statusColor } from '@/models/occupancyModel'
import type { OccupancyStatus } from '@/models/occupancyModel'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const { history, averageOccupancy, statusDistribution, trend, getStatusLabel, clearHistory } = useHistory()

const trendLabel = computed(() => {
  if (trend.value === 'subiendo') return 'Subiendo'
  if (trend.value === 'bajando') return 'Bajando'
  return 'Estable'
})

const trendArrow = computed(() => {
  if (trend.value === 'subiendo') return '↑'
  if (trend.value === 'bajando') return '↓'
  return '→'
})

const trendClass = computed(() => ({
  'trend-up': trend.value === 'subiendo',
  'trend-down': trend.value === 'bajando',
  'trend-stable': trend.value === 'estable',
}))

function distWidth(count: number): string {
  const max = Math.max(...Object.values(statusDistribution.value))
  return max > 0 ? `${(count / max) * 100}%` : '0%'
}

function distColor(status: OccupancyStatus): string {
  return statusColor(status)
}

// Gráfica de barras del historial (últimas 20)
const historyChartData = computed(() => {
  const items = [...history.value].reverse().slice(-20)
  return {
    labels: items.map(e => e.horizon),
    datasets: [
      {
        label: 'Ocupación final (%)',
        data: items.map(e => parseFloat(e.finalOccupancy.toFixed(1))),
        backgroundColor: items.map(e => statusColor(e.status) + '99'),
        borderColor: items.map(e => statusColor(e.status)),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const historyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a2236',
      borderColor: 'rgba(99,155,255,0.2)',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
    },
  },
  scales: {
    x: { grid: { color: 'rgba(99,155,255,0.06)' }, ticks: { color: '#4b5979', font: { size: 10 } } },
    y: {
      min: 0, max: 100,
      grid: { color: 'rgba(99,155,255,0.06)' },
      ticks: { color: '#4b5979', callback: (v: any) => `${v}%` },
    },
  },
}
</script>

<style scoped>
.stats-page { padding: 2rem; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 2rem;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }

.btn-clear {
  padding: 0.45rem 1rem; background: transparent;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-muted); font-size: 0.8rem; cursor: pointer;
  transition: all 0.2s;
}
.btn-clear:hover { border-color: #ef4444; color: #ef4444; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 4rem; text-align: center; color: var(--text-muted);
}

/* Summary grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {}
.big-num { font-size: 2rem; font-weight: 700; margin-top: 0.4rem; }
.big-num small { font-size: 1rem; color: var(--text-secondary); }

.trend-up    { color: #ef4444; }
.trend-down  { color: #10b981; }
.trend-stable { color: var(--text-accent); }
.trend-arrow { font-size: 1.5rem; }

/* Distribution bars */
.dist-bars { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.6rem; }
.dist-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
.dist-label { width: 70px; color: var(--text-secondary); font-size: 0.7rem; }
.dist-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.dist-bar { height: 100%; border-radius: 3px; transition: width 0.5s; }
.dist-count { width: 20px; text-align: right; color: var(--text-muted); font-size: 0.72rem; }

/* Chart */
.chart-section { margin-bottom: 1.5rem; }
.section-title { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 1rem; }
.chart-wrap { height: 220px; }

/* Table */
.table-section {}
.table-wrap { overflow-x: auto; }

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.history-table th {
  text-align: left; padding: 0.6rem 0.75rem;
  color: var(--text-muted); font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}
.history-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid rgba(99,155,255,0.05);
  vertical-align: middle;
}
.history-table tr:hover td { background: rgba(59,130,246,0.04); }

.text-muted  { color: var(--text-muted); }
.text-accent { color: var(--text-accent); }
</style>
