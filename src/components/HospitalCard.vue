<template>
  <button
    class="hospital-card card"
    :class="{ selected: isSelected }"
    @click="$emit('select', hospital)"
  >
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

    <h3 class="hosp-card-name">{{ hospital.name }}</h3>

    <div class="occ-display">
      <!-- Anillo de ocupación SVG -->
      <div class="occ-ring-wrap">
        <svg width="56" height="56" viewBox="0 0 56 56">
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
.hospital-card {
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  border-color: var(--border);
  width: 100%;
}
.hospital-card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
.hospital-card.selected { border-color: var(--accent); background: rgba(59,130,246,0.06); }

.hosp-card-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem;
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

.occ-ring-wrap {
  position: relative; width: 56px; height: 56px; flex-shrink: 0;
}
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

@media (max-width: 479px) {
  .occ-ring-wrap { width: 48px; height: 48px; }
  .occ-ring-wrap svg { width: 48px; height: 48px; }
  .occ-pct { font-size: 0.75rem; }
  .hosp-card-name { font-size: 0.82rem; }
}
</style>