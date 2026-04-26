<template>
  <div class="stats-page">
    <!-- Confirm delete modal -->
    <Transition name="fade">
      <div v-if="confirmEntry" class="modal-overlay" @click.self="confirmEntry = null">
        <div class="modal-card">
          <div class="modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <h3 class="modal-title">¿Borrar simulación?</h3>
          <p class="modal-desc">
            Esta acción eliminará la simulación del
            <strong>{{ confirmEntry.timestamp }}</strong>
            {{ confirmEntry.hospitalName ? `(${confirmEntry.hospitalName})` : '' }}.
            No se puede deshacer.
          </p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="confirmEntry = null">Cancelar</button>
            <button class="btn-delete-confirm" @click="doDelete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
              Sí, borrar
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <header class="page-header">
      <div>
        <h1 class="page-title">Estadísticas e Historial</h1>
        <p class="page-sub">Registro de simulaciones y análisis de tendencias</p>
      </div>
      <div class="header-actions">
        <button
          v-if="isFirebaseEnabled"
          class="btn-refresh"
          :class="{ loading: isLoading }"
          @click="refreshFromCloud"
          :disabled="isLoading"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            :style="{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          <span class="btn-refresh-text">{{ isLoading ? 'Cargando...' : 'Sincronizar' }}</span>
        </button>
        <div class="cloud-badge" :class="{ online: isFirebaseEnabled }">
          <span class="cloud-dot"></span>
          <span class="cloud-badge-text">{{ isFirebaseEnabled ? 'Firebase conectado' : 'Solo memoria' }}</span>
        </div>
        <button v-if="history.length" class="btn-clear" @click="clearHistory">
          Limpiar
        </button>
      </div>
    </header>

    <!-- Empty / loading -->
    <div v-if="!history.length && !isLoading" class="empty-state card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <p>Aún no hay simulaciones registradas.<br/>Ve al Dashboard y ejecuta una predicción.</p>
    </div>
    <div v-if="isLoading && !history.length" class="loading-state card">
      <div class="spinner"></div>
      <p>Cargando historial desde Firebase...</p>
    </div>

    <template v-else-if="history.length">
      <!-- Summary cards -->
      <div class="summary-grid">
        <div class="card summary-card">
          <p class="label">Total de simulaciones</p>
          <p class="big-num mono">{{ history.length }}</p>
          <p class="card-sub" v-if="isFirebaseEnabled">
            <span>☁</span> Incluye datos de la nube
          </p>
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

      <!-- Gráfica -->
      <div class="card chart-section" v-if="history.length > 1">
        <h3 class="section-title">Evolución de ocupación por simulación</h3>
        <div class="chart-wrap">
          <Bar :data="historyChartData" :options="historyChartOptions" />
        </div>
      </div>

      <!-- Tabla con paginación -->
      <div class="card table-section">
        <div class="table-header">
          <h3 class="section-title" style="margin:0">Registro de simulaciones</h3>
          <div class="table-meta">
            <span class="label">
              {{ paginatedHistory.length }} de {{ history.length }} registros
            </span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th class="col-hospital">Hospital</th>
                <th>Horizonte</th>
                <th class="col-num">Pacientes</th>
                <th class="col-num">Ing./día</th>
                <th class="col-num">Altas/día</th>
                <th>Ocup. final</th>
                <th class="col-peak">Pico</th>
                <th>Estado</th>
                <th v-if="isFirebaseEnabled" class="col-source">Fuente</th>
                <th class="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in paginatedHistory"
                :key="entry.id"
                :class="{ 'row-deleting': deletingId === entry.id }"
              >
                <td class="mono text-muted">{{ entry.timestamp }}</td>
                <td class="col-hospital">
                  <span v-if="entry.hospitalName" class="hosp-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
                    </svg>
                    {{ entry.hospitalName }}
                  </span>
                  <span v-else class="text-muted" style="font-size:0.75rem">—</span>
                </td>
                <td class="mono text-accent">{{ entry.horizon }}</td>
                <td class="mono col-num">{{ entry.patients }}</td>
                <td class="mono col-num">{{ entry.admissions }}</td>
                <td class="mono col-num">{{ entry.discharges }}</td>
                <td class="mono">{{ entry.finalOccupancy.toFixed(1) }}%</td>
                <td class="mono col-peak">{{ entry.peakOccupancy.toFixed(1) }}%</td>
                <td><StatusBadge :status="entry.status" /></td>
                <td v-if="isFirebaseEnabled" class="col-source">
                  <span class="source-tag" :class="entry.firestoreId ? 'cloud' : 'local'">
                    {{ entry.firestoreId ? '☁ Nube' : '💾 Local' }}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="btn-row-delete" @click="askDelete(entry)" title="Borrar simulación">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginador -->
        <div class="paginator" v-if="totalPages > 1">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="page-numbers">
            <button
              v-for="p in pageNumbers"
              :key="p"
              class="page-num"
              :class="{ active: p === currentPage, ellipsis: p === '...' }"
              :disabled="p === '...'"
              @click="typeof p === 'number' && (currentPage = p)"
            >{{ p }}</button>
          </div>

          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <span class="page-info label">Pág. {{ currentPage }} / {{ totalPages }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import StatusBadge from '@/components/StatusBadge.vue'
import { useHistory, PAGE_SIZE } from '@/composables/useHistory'
import { statusColor } from '@/models/occupancyModel'
import type { OccupancyStatus } from '@/models/occupancyModel'
import type { HistoryEntry } from '@/composables/useHistory'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const {
  history, averageOccupancy, statusDistribution, trend,
  getStatusLabel, clearHistory, loadFromFirestore,
  deleteEntry, isFirebaseEnabled,
} = useHistory()

const isLoading = ref(false)
const confirmEntry = ref<HistoryEntry | null>(null)
const deletingId = ref<number | null>(null)

// Paginación
const currentPage = ref(1)
const pageSize = PAGE_SIZE

const totalPages = computed(() => Math.ceil(history.value.length / pageSize))

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return history.value.slice(start, start + pageSize)
})

watch(() => history.value.length, () => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value
  }
})

const pageNumbers = computed((): (number | string)[] => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    pages.push(i)
  }
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function askDelete(entry: HistoryEntry) {
  confirmEntry.value = entry
}

async function doDelete() {
  if (!confirmEntry.value) return
  deletingId.value = confirmEntry.value.id
  await deleteEntry(confirmEntry.value.id)
  confirmEntry.value = null
  deletingId.value = null
}

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
function distColor(status: OccupancyStatus): string { return statusColor(status) }

async function refreshFromCloud() {
  isLoading.value = true
  await loadFromFirestore()
  isLoading.value = false
}

onMounted(async () => {
  if (isFirebaseEnabled) {
    isLoading.value = true
    await loadFromFirestore()
    isLoading.value = false
  }
})

const historyChartData = computed(() => {
  const items = [...history.value].reverse().slice(-20)
  return {
    labels: items.map(e => e.hospitalName ? e.hospitalName.split(' ').slice(0, 2).join(' ') : e.horizon),
    datasets: [{
      label: 'Ocupación final (%)',
      data: items.map(e => parseFloat(e.finalOccupancy.toFixed(1))),
      backgroundColor: items.map(e => statusColor(e.status) + '99'),
      borderColor: items.map(e => statusColor(e.status)),
      borderWidth: 1,
      borderRadius: 4,
    }],
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

/* ── Modal ────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(10,15,30,0.85); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-card {
  background: var(--bg-surface); border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg); padding: 2rem;
  max-width: 400px; width: 100%; text-align: center;
  animation: pop-in 0.2s cubic-bezier(.16,1,.3,1);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
}
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.94) translateY(10px); }
  to { opacity: 1; transform: none; }
}
.modal-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
  display: flex; align-items: center; justify-content: center;
  color: #ef4444; margin: 0 auto 1rem;
}
.modal-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
.modal-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: center; }
.btn-cancel {
  padding: 0.6rem 1.25rem; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-secondary); font-family: var(--font-body);
  font-size: 0.875rem; cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { border-color: var(--border-strong); color: var(--text-primary); }
.btn-delete-confirm {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 1.25rem;
  background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4);
  border-radius: var(--radius-sm); color: #fca5a5;
  font-family: var(--font-body); font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-delete-confirm:hover { background: rgba(239,68,68,0.25); }

/* ── Header ───────────────────────────────────────────────── */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;
}
.page-title { font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.2rem; }
.header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end; }

.btn-refresh {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);
  border-radius: var(--radius-sm); color: var(--text-accent);
  font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
}
.btn-refresh:hover:not(:disabled) { background: var(--accent-glow); }
.btn-refresh:disabled { opacity: 0.6; cursor: default; }
@keyframes spin { to { transform: rotate(360deg); } }

.cloud-badge {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.7rem; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 100px;
  font-size: 0.72rem; color: var(--text-muted);
}
.cloud-badge.online { color: var(--status-normal); border-color: rgba(16,185,129,0.3); }
.cloud-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
.cloud-badge.online .cloud-dot { background: var(--status-normal); box-shadow: 0 0 4px var(--status-normal); }

.btn-clear {
  padding: 0.4rem 0.85rem; background: transparent;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-muted); font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
}
.btn-clear:hover { border-color: #ef4444; color: #ef4444; }

/* ── Empty / Loading ─────────────────────────────────────── */
.empty-state, .loading-state {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 4rem; text-align: center; color: var(--text-muted);
}
.spinner {
  width: 28px; height: 28px; border: 2px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ── Summary grid ────────────────────────────────────────── */
.summary-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1rem; margin-bottom: 1.5rem;
}
.big-num { font-size: 2rem; font-weight: 700; margin-top: 0.4rem; }
.big-num small { font-size: 1rem; color: var(--text-secondary); }
.card-sub { font-size: 0.7rem; color: var(--status-normal); margin-top: 0.3rem; }

.trend-up    { color: #ef4444; }
.trend-down  { color: #10b981; }
.trend-stable { color: var(--text-accent); }
.trend-arrow { font-size: 1.5rem; }

.dist-bars { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.6rem; }
.dist-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
.dist-label { width: 70px; color: var(--text-secondary); font-size: 0.7rem; }
.dist-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.dist-bar { height: 100%; border-radius: 3px; transition: width 0.5s; }
.dist-count { width: 20px; text-align: right; color: var(--text-muted); font-size: 0.72rem; }

/* ── Chart ───────────────────────────────────────────────── */
.chart-section { margin-bottom: 1.5rem; }
.section-title { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 1rem; }
.chart-wrap { height: 220px; }

/* ── Table ───────────────────────────────────────────────── */
.table-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;
}
.table-meta { font-size: 0.72rem; color: var(--text-muted); }
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.history-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 640px; }
.history-table th {
  text-align: left; padding: 0.6rem 0.75rem;
  color: var(--text-muted); font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.history-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid rgba(99,155,255,0.05);
  vertical-align: middle;
}
.history-table tr:hover td { background: rgba(59,130,246,0.04); }
.row-deleting td { opacity: 0.4; transition: opacity 0.2s; }

.th-actions { width: 60px; text-align: center; }
.td-actions { text-align: center; }

.btn-row-delete {
  padding: 0.3rem; background: transparent;
  border: 1px solid transparent; border-radius: var(--radius-sm);
  color: var(--text-muted); cursor: pointer; transition: all 0.15s;
}
.btn-row-delete:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; background: rgba(239,68,68,0.1); }

.text-muted  { color: var(--text-muted); }
.text-accent { color: var(--text-accent); }

.hosp-tag {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.75rem; color: var(--text-accent);
}

.source-tag {
  font-size: 0.68rem; padding: 0.15rem 0.5rem;
  border-radius: 100px; font-weight: 600;
}
.source-tag.cloud { background: rgba(16,185,129,0.1); color: #10b981; }
.source-tag.local { background: rgba(148,163,184,0.1); color: var(--text-muted); }

/* ── Paginador ───────────────────────────────────────────── */
.paginator {
  display: flex; align-items: center; justify-content: center;
  gap: 0.35rem; padding-top: 1.25rem; border-top: 1px solid var(--border);
  margin-top: 0.75rem; flex-wrap: wrap;
}
.page-btn {
  padding: 0.4rem 0.6rem; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--text-accent); }
.page-btn:disabled { opacity: 0.3; cursor: default; }

.page-numbers { display: flex; gap: 0.25rem; }
.page-num {
  min-width: 32px; height: 32px; padding: 0 0.4rem;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-secondary);
  font-size: 0.8rem; font-family: var(--font-mono);
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.page-num:hover:not(.ellipsis):not(.active) { border-color: var(--accent); color: var(--text-accent); }
.page-num.active {
  background: var(--accent); border-color: var(--accent);
  color: white; font-weight: 700;
}
.page-num.ellipsis { cursor: default; border-color: transparent; background: transparent; }

.page-info { margin-left: 0.5rem; }

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════ */

/* ── Tablet (768px - 1023px) ─────────────────────────────── */
@media (max-width: 1023px) {
  .stats-page { padding: 1.5rem; }

  /* Summary: 2 columnas */
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Tabla: ocultar columnas menos críticas */
  .col-num { display: none; }

  /* Cloud badge: texto abreviado */
  .cloud-badge-text { display: none; }
}

/* ── Mobile (< 768px) ────────────────────────────────────── */
@media (max-width: 767px) {
  .stats-page { padding: 1rem; }

  /* Header */
  .page-header {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .page-title { font-size: 1.2rem; }
  .page-sub   { font-size: 0.8rem; }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 0.5rem;
  }

  /* Botón refresh: solo icono */
  .btn-refresh-text { display: none; }
  .btn-refresh { padding: 0.4rem 0.6rem; }

  /* Cloud badge: solo punto */
  .cloud-badge-text { display: none; }
  .cloud-badge { padding: 0.35rem 0.55rem; }

  /* Summary: 1 columna */
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .big-num { font-size: 1.75rem; }

  /* Chart: menos alto */
  .chart-wrap { height: 180px; }

  /* Tabla: ocultar más columnas para caber en móvil */
  .col-num    { display: none; }
  .col-peak   { display: none; }
  .col-source { display: none; }
  .col-hospital { max-width: 100px; }
  .hosp-tag { font-size: 0.7rem; }

  /* Table: texto más pequeño */
  .history-table { font-size: 0.75rem; min-width: 480px; }
  .history-table th,
  .history-table td { padding: 0.5rem 0.5rem; }

  /* Paginador: compacto */
  .paginator { gap: 0.25rem; padding-top: 1rem; }
  .page-num  { min-width: 28px; height: 28px; font-size: 0.75rem; }
  .page-info { display: none; }

  /* Modal: más compacto */
  .modal-card { padding: 1.5rem 1.25rem; }
  .modal-actions { flex-direction: column; }
  .btn-cancel,
  .btn-delete-confirm { width: 100%; justify-content: center; }

  /* Empty state */
  .empty-state { padding: 2.5rem 1rem; font-size: 0.875rem; }
}

/* ── Muy pequeño (< 480px) ───────────────────────────────── */
@media (max-width: 479px) {
  .history-table { min-width: 380px; }
  .history-table th,
  .history-table td { padding: 0.45rem 0.4rem; }

  /* Solo columnas esenciales */
  .col-hospital { display: none; }

  /* Summary: números más pequeños */
  .big-num { font-size: 1.5rem; }
}
</style>