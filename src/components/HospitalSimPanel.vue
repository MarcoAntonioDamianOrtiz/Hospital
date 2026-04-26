<template>
  <div class="sim-panel card">
    <!-- Header -->
    <div class="sim-header">
      <div class="sim-hosp-info">
        <div class="sim-pin" :style="{ background: typeColors[hospital.type] }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
          </svg>
        </div>
        <div class="sim-hosp-text">
          <h3 class="sim-title">{{ hospital.name }}</h3>
          <p class="sim-meta">Datos preconfigurados por el administrador</p>
        </div>
      </div>

      <div class="sim-horizons">
        <button
          v-for="h in horizons"
          :key="h.value"
          class="h-btn"
          :class="{ active: horizon === h.value }"
          @click="$emit('run', h.value)"
        >{{ h.label }}</button>
      </div>
    </div>

    <!-- Body: solo si hay resultado -->
    <div class="sim-body" v-if="result">
      <!-- Métricas -->
      <div class="sim-metrics">
        <div class="sim-metric card">
          <p class="label">Estado proyectado</p>
          <StatusBadge :status="result.status" style="margin-top:0.5rem" />
        </div>
        <div class="sim-metric card">
          <p class="label">Ocupación final</p>
          <p class="big-val mono" :style="{ color: statusColor(result.status) }">
            {{ result.finalOccupancy.toFixed(1) }}<small>%</small>
          </p>
        </div>
        <div class="sim-metric card">
          <p class="label">Pico proyectado</p>
          <p class="big-val mono">{{ result.peakOccupancy.toFixed(1) }}<small>%</small></p>
          <p class="metric-sub">en ~{{ result.peakTime.toFixed(0) }}h</p>
        </div>
        <div class="sim-metric card">
          <p class="label">Camas disponibles</p>
          <p class="big-val mono" style="color: var(--status-normal)">
            {{ Math.max(0, hospital.capacity - hospital.currentPatients) }}
          </p>
          <p class="metric-sub">de {{ hospital.capacity }} total</p>
        </div>
      </div>

      <!-- Alerta -->
      <AlertBanner v-if="result.alert" :alert="result.alert" :status="result.status" />

      <!-- Gráfica -->
      <div class="chart-wrap-sim" v-if="result.points.length > 1">
        <OccupancyChart :points="result.points" :horizon="horizon" />
      </div>
    </div>

    <!-- Estado vacío (antes de primera simulación) -->
    <div class="sim-empty" v-else>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <p>Selecciona un horizonte para simular</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import OccupancyChart from '@/components/OccupancyChart.vue'
import { type Hospital } from '@/services/hospitals'
import { statusColor } from '@/models/occupancyModel'
import type { SimulationResult } from '@/models/occupancyModel'

defineProps<{
  hospital: Hospital
  horizon: number
  result: SimulationResult | null
}>()

defineEmits<{ (e: 'run', horizonValue: number): void }>()

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
</script>

<style scoped>
.sim-panel { margin-bottom: 1.5rem; padding: 0; overflow: hidden; }

/* ── Header ──────────────────────────────────────────────── */
.sim-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  gap: 1rem;
  flex-wrap: wrap;
}
.sim-hosp-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}
.sim-pin {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.sim-hosp-text { flex: 1; min-width: 0; }
.sim-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sim-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }

/* Botones de horizonte */
.sim-horizons { display: flex; gap: 0.35rem; flex-shrink: 0; }
.h-btn {
  padding: 0.35rem 0.75rem;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}
.h-btn:hover { border-color: var(--accent); color: var(--text-accent); }
.h-btn.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--text-accent);
  font-weight: 700;
}

/* ── Body ────────────────────────────────────────────────── */
.sim-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Métricas: 4 columnas desktop ────────────────────────── */
.sim-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.sim-metric { padding: 0.85rem 1rem; }
.big-val {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 0.4rem;
  line-height: 1;
}
.big-val small { font-size: 0.9rem; color: var(--text-secondary); }
.metric-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; }

.chart-wrap-sim { height: 250px; }

/* ── Empty ───────────────────────────────────────────────── */
.sim-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}

/* ══════════════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════════════ */

/* ── Tablet ──────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .sim-metrics { grid-template-columns: repeat(2, 1fr); }
}

/* ── Móvil ───────────────────────────────────────────────── */
@media (max-width: 767px) {
  /* Header: info arriba, horizontes abajo */
  .sim-header {
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
  }

  /* Horizontes: 4 en fila completa */
  .sim-horizons {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.35rem;
  }
  .h-btn {
    text-align: center;
    padding: 0.45rem 0.25rem;
    font-size: 0.75rem;
  }

  /* Métricas: 2 columnas */
  .sim-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
  .sim-metric { padding: 0.75rem; }
  .big-val { font-size: 1.5rem; }

  .sim-body { padding: 1rem; gap: 0.85rem; }
  .chart-wrap-sim { height: 210px; }
  .sim-title { font-size: 0.85rem; }
}

/* ── Muy pequeño ─────────────────────────────────────────── */
@media (max-width: 399px) {
  .sim-metrics { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
  .sim-metric { padding: 0.6rem 0.65rem; }
  .big-val { font-size: 1.35rem; }
  .chart-wrap-sim { height: 180px; }

  /* Nombre del hospital: hasta 2 líneas */
  .sim-title { white-space: normal; }
}
</style>