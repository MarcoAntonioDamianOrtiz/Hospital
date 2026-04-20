<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-main">HosPredict</span>
          <span class="logo-sub">Sistema Inteligente</span>
        </div>
      </div>

      <div class="nav-links">
        <RouterLink to="/" class="nav-item" :class="{ active: route.name === 'dashboard' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink to="/estadisticas" class="nav-item" :class="{ active: route.name === 'estadisticas' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Estadísticas</span>
        </RouterLink>
      </div>

      <div class="sidebar-footer">
        <div class="status-dot"></div>
        <span>Sistema activo</span>
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ─────────────────────────────────────────────── */
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 1.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, var(--accent), #6366f1);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 0 20px var(--accent-glow);
}

.logo-text { display: flex; flex-direction: column; }
.logo-main { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
.logo-sub  { font-size: 0.65rem; color: var(--text-muted); letter-spacing: 0.05em; }

.nav-links { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover { background: var(--bg-card); color: var(--text-primary); }
.nav-item.active {
  background: var(--accent-glow);
  color: var(--text-accent);
  border: 1px solid rgba(59,130,246,0.3);
}

.sidebar-footer {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
  margin-top: auto;
}

.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--status-normal);
  box-shadow: 0 0 6px var(--status-normal);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Main content ────────────────────────────────────────── */
.main-content {
  flex: 1;
  margin-left: 220px;
  min-height: 100vh;
  background: var(--bg-base);
}
</style>
