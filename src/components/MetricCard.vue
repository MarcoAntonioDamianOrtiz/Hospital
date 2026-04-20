<template>
  <div class="metric-card card">
    <p class="label">{{ label }}</p>
    <div class="value-row">
      <span class="value mono">{{ value }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <p v-if="sub" class="sub">{{ sub }}</p>
    <div v-if="showBar" class="progress-bar">
      <div class="bar-fill" :style="{ width: barWidth, background: barColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  unit?: string
  sub?: string
  percent?: number
  barColor?: string
}>()

const showBar = computed(() => props.percent !== undefined)
const barWidth = computed(() => `${Math.min(props.percent ?? 0, 100)}%`)
const barColor = computed(() => props.barColor ?? '#3b82f6')
</script>

<style scoped>
.metric-card { position: relative; overflow: hidden; }

.value-row { display: flex; align-items: baseline; gap: 0.3rem; margin-top: 0.4rem; }
.value { font-size: 2rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
.unit  { font-size: 0.9rem; color: var(--text-muted); }
.sub   { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.3rem; }

.progress-bar {
  margin-top: 0.75rem;
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s cubic-bezier(.16,1,.3,1);
}
</style>
