<template>
  <span class="badge" :class="status">
    <span class="dot"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OccupancyStatus } from '@/models/occupancyModel'
import { statusLabel } from '@/models/occupancyModel'

const props = defineProps<{ status: OccupancyStatus }>()
const label = computed(() => statusLabel(props.status))
</script>

<style scoped>
.badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  animation: blink 1.8s infinite;
}

@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

.normal  { background: rgba(16,185,129,.15); color: #10b981; border: 1px solid rgba(16,185,129,.25); }
.normal .dot { background: #10b981; }

.alto    { background: rgba(245,158,11,.15); color: #f59e0b; border: 1px solid rgba(245,158,11,.25); }
.alto .dot { background: #f59e0b; }

.saturado { background: rgba(249,115,22,.15); color: #f97316; border: 1px solid rgba(249,115,22,.25); }
.saturado .dot { background: #f97316; }

.colapso { background: rgba(239,68,68,.15); color: #ef4444; border: 1px solid rgba(239,68,68,.25); }
.colapso .dot { background: #ef4444; animation: blink-fast 0.8s infinite; }

@keyframes blink-fast { 0%,100%{opacity:1} 50%{opacity:0} }
</style>
