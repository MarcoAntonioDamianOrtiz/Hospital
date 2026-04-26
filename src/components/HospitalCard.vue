<template>
  <button
    class="hospital-card card"
    :class="{ selected: isSelected }"
    @click="$emit('select', hospital)"
  >
    <!-- Top: tipo + ciudad -->
    <div class="hosp-card-top">
      <span
        class="type-pill"
        :style="{
          background: typeColors[hospital.type] + '22',
          color: typeColors[hospital.type],
          borderColor: typeColors[hospital.type] + '55'
        }"
      >
        {{ hospital.type }}
      </span>
      <span class="hosp-city-tag">{{ hospital.city }}</span>
    </div>

    <!-- Nombre -->
    <h3 class="hosp-card-name">{{ hospital.name }}</h3>

    <!-- Ocupación: anillo + stats -->
    <div class="occ-display">
      <div class="occ-ring-wrap">
        <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
          <circle
            cx="28" cy="28" r="22"
            fill="none"
            :stroke="occColor"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="`${(occupancy / 100) * 138} 138`"
            transform="rotate(-90 28 28)"
            style="transition: stroke-dasharray 0.6s"
          />
        </svg>
        <span class="occ-pct mono" :style="{ color: occColor }">
          {{ occupancy.toFixed(0) }}<small>%</small>
        </span>
      </div>

      <div class="occ-stats">
        <div class="occ-stat">
          <span class="occ-label">Camas libres</span>
          <span class="occ-val mono" style="color: var(--status-normal)">
            {{ Math.max(0, hospital.capacity - hospital.currentPatients) }}
          </span>
        </div>
        <div class="occ-stat">
          <span class="occ-label">Total camas</span>
          <span class="occ-val mono">{{ hospital.capacity }}</span>
        </div>
        <div class="occ-stat">
          <span class="occ-label">Ingresos/día</span>
          <span class="occ-val mono">{{ hospital.dailyAdmissions }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de ocupación -->
    <div class="occ-bar-wrap">
      <div
        class="occ-bar-fill"
        :style="{ width: Math.min(occupancy, 100) + '%', background: occColor }"
      ></div>
    </div>

    <!-- Estado + acción -->
    <div class="hosp-status-row">
      <StatusBadge :status="occStatus" />
      <span class="select-hint" v-if="!isSelected">Simular →</span>
      <span class="selected-hint" v-else>✓ Seleccionado</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { type Hospital, hospitalOccupancy } from '@/services/hospitals'
import type { OccupancyStatus } from '@/models/occupancyModel'

const props = defineProps<{
  hospital: Hospital
  isSelected: boolean
}>()

defineEmits<{ (e: 'select', hospital: Hospital): void }>()

const typeColors: Record<Hospital['type'], string> = {
  IMSS: '#3b82f6',
  ISSSTE: '#8b5cf6',
  SSA: '#10b981',
  Privado: '#f59e0b',
}

const occupancy = computed(() => hospitalOccupancy(props.hospital))

const occColor = computed((): string => {
  const pct = occupancy.value
  if (pct < 75) return '#10b981'
  if (pct < 85) return '#f59e0b'
  if (pct < 95) return '#f97316'
  return '#ef4444'
})

const occStatus = computed((): OccupancyStatus => {
  const pct = occupancy.value
  if (pct < 75) return 'normal'
  if (pct < 85) return 'alto'
  if (pct < 95) return 'saturado'
  return 'colapso'
})
</script>

<style scoped>
/* Reset completo del botón — crítico para que el contenido sea visible */
.hospital-card {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-body);
  color: inherit;
  transition: all 0.2s;
  border-color: var(--border);
}
.hospital-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.hospital-card.selected {
  border-color: var(--accent);
  background: rgba(59,130,246,0.06);
}

/* ── Top ─────────────────────────────────────────────────── */
.hosp-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.45rem;
}
.type-pill {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 100px;
  border: 1px solid;
  letter-spacing: 0.04em;
}
.hosp-city-tag {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* ── Nombre ──────────────────────────────────────────────── */
.hosp-card-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 0.85rem;
  word-break: break-word;
}

/* ── Ocupación ───────────────────────────────────────────── */
.occ-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.occ-ring-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}
.occ-pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 700;
}
.occ-pct small { font-size: 0.52rem; opacity: 0.7; }

.occ-stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  min-width: 0;
}
.occ-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.occ-label { font-size: 0.68rem; color: var(--text-muted); }
.occ-val   { font-size: 0.78rem; font-weight: 600; color: var(--text-primary); }

/* ── Barra de progreso ───────────────────────────────────── */
.occ-bar-wrap {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px;
  overflow: hidden;   /* recorta el fill al ancho del contenedor */
  margin-bottom: 0.75rem;
  /* box-sizing ya es border-box por el reset global */
}
.occ-bar-fill {
  height: 100%;
  border-radius: 2px;
  max-width: 100%;    /* segunda línea de defensa */
  transition: width 0.5s cubic-bezier(.16,1,.3,1);
}

/* ── Status row ──────────────────────────────────────────── */
.hosp-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.select-hint   { font-size: 0.7rem; color: var(--text-muted); }
.selected-hint { font-size: 0.7rem; color: var(--accent); font-weight: 600; }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 767px) {
  .occ-ring-wrap { width: 48px; height: 48px; }
  .occ-ring-wrap svg { width: 48px; height: 48px; }
  .occ-pct       { font-size: 0.75rem; }
  .hosp-card-name { font-size: 0.85rem; margin-bottom: 0.7rem; }
  .occ-label     { font-size: 0.65rem; }
  .occ-val       { font-size: 0.75rem; }
}

@media (max-width: 399px) {
  .occ-ring-wrap { display: none; }
  .occ-stats     { flex-direction: row; flex-wrap: wrap; gap: 0.4rem 1rem; }
  .occ-stat      { flex-direction: column; gap: 0.05rem; align-items: flex-start; }
  .hosp-card-name { font-size: 0.82rem; }
}
</style>