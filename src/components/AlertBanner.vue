<template>
  <Transition name="slide-up">
    <div v-if="alert" class="alert-banner" :class="status">
      <div class="alert-icon">
        <svg v-if="status === 'colapso'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="alert-text">{{ alert }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  alert: string | null
  status: string
}>()
</script>

<style scoped>
.alert-banner {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-radius: var(--radius-sm);
  border-left: 3px solid;
}
.alert-icon { flex-shrink: 0; margin-top: 1px; }
.alert-text { font-size: 0.875rem; line-height: 1.5; }

.alto    { background: rgba(245,158,11,.1); border-color: #f59e0b; color: #fcd34d; }
.saturado { background: rgba(249,115,22,.1); border-color: #f97316; color: #fdba74; }
.colapso { background: rgba(239,68,68,.1); border-color: #ef4444; color: #fca5a5; }
</style>
