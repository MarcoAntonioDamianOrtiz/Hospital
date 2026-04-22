<template>
  <div class="app-shell">
    <!-- Sidebar solo cuando está logueado -->
    <nav v-if="isLoggedIn()" class="sidebar">
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

      <!-- Rol badge -->
      <div class="role-badge" :class="currentUser?.role">
        <svg v-if="isAdmin()" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        {{ isAdmin() ? 'Administrador' : 'Usuario' }}
      </div>

      <div class="nav-links">
        <!-- Admin links -->
        <template v-if="isAdmin()">
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
        </template>

        <!-- User links -->
        <template v-else>
          <RouterLink to="/consulta" class="nav-item" :class="{ active: route.name === 'consulta' }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Buscar Hospital</span>
          </RouterLink>
        </template>
      </div>

      <!-- User info + logout -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ currentUser?.avatar }}</div>
        <div class="user-info">
          <p class="user-name">{{ currentUser?.name }}</p>
          <p class="user-role">{{ isAdmin() ? 'Administrador' : 'Usuario' }}</p>
        </div>
        <button class="btn-logout" @click="handleLogout" title="Cerrar sesión">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <div class="sidebar-footer">
        <div class="status-dot"></div>
        <span>Sistema activo</span>
      </div>
    </nav>

    <!-- Main content -->
    <main :class="['main-content', { 'no-sidebar': !isLoggedIn() }]">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, isAdmin, currentUser, logout } = useAuth()

function handleLogout() {
  logout()
  router.push('/login')
}
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
  padding: 0.5rem 0.5rem 1.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.75rem;
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

/* Role badge */
.role-badge {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.7rem; margin-bottom: 1rem;
  border-radius: 100px; font-size: 0.65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  border: 1px solid;
}
.role-badge.admin {
  background: rgba(59,130,246,0.1); color: var(--text-accent);
  border-color: rgba(59,130,246,0.3);
}
.role-badge.usuario {
  background: rgba(16,185,129,0.1); color: var(--status-normal);
  border-color: rgba(16,185,129,0.3);
}

.nav-links { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem; font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover { background: var(--bg-card); color: var(--text-primary); }
.nav-item.active {
  background: var(--accent-glow);
  color: var(--text-accent);
  border: 1px solid rgba(59,130,246,0.3);
}

/* User card */
.sidebar-user {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.75rem;
  margin-top: auto;
  background: var(--bg-card); border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  margin-bottom: 0.75rem;
}

.user-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  background: linear-gradient(135deg, var(--accent), #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700; color: white; flex-shrink: 0;
}

.user-info { flex: 1; min-width: 0; }
.user-name {
  font-size: 0.78rem; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-role { font-size: 0.65rem; color: var(--text-muted); margin-top: 0.05rem; }

.btn-logout {
  padding: 0.35rem; background: transparent;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-muted); cursor: pointer; transition: all 0.15s;
  flex-shrink: 0;
}
.btn-logout:hover { border-color: #ef4444; color: #ef4444; }

.sidebar-footer {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem;
  font-size: 0.75rem; color: var(--text-muted);
  border-top: 1px solid var(--border);
}

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--status-normal);
  box-shadow: 0 0 6px var(--status-normal);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── Main content ────────────────────────────────────────── */
.main-content {
  flex: 1;
  margin-left: 220px;
  min-height: 100vh;
  background: var(--bg-base);
}
.main-content.no-sidebar {
  margin-left: 0;
}
</style>