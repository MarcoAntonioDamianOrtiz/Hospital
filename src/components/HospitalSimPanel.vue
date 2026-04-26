<template>
  <div class="sim-panel card">
    <div class="sim-header">
      <div class="sim-hosp-info">
        <div class="sim-pin" :style="{ background: typeColors[hospital.type] }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
          </svg>
        </div>
        <div>
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

    <div class="sim-body" v-if="result">
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

      <AlertBanner v-if="result.alert" :alert="result.alert" :status="result.status" />

      <div class="chart-wrap-sim" v-if="result.points.length > 1">
        <OccupancyChart :points="result.points" :horizon="horizon" />
      </div>
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

@media (max-width: 1023px) {
  .sim-metrics { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767px) {
  .sim-header { flex-direction: column; padding: 1rem; gap: 0.75rem; }
  .sim-title { font-size: 0.85rem; }
  .sim-horizons {
    width: 100%; display: grid;
    grid-template-columns: repeat(4, 1fr); gap: 0.35rem;
  }
  .h-btn { text-align: center; padding: 0.4rem 0.3rem; font-size: 0.75rem; }
  .sim-metrics { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
  .sim-metric { padding: 0.75rem; }
  .big-val { font-size: 1.5rem; }
  .sim-body { padding: 1rem; }
  .chart-wrap-sim { height: 210px; }
}
</style>