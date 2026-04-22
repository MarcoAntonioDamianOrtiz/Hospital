<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="grid-lines"></div>
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
    </div>

    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-pulse">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <h1 class="login-title">HosPredict</h1>
          <p class="login-subtitle">Sistema de Predicción Hospitalaria</p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Error -->
      <Transition name="shake">
        <div v-if="error" class="login-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>
      </Transition>

      <!-- Formulario -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field-group">
          <label class="field-label">Usuario</label>
          <div class="field-wrap">
            <svg class="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              v-model="username"
              type="text"
              class="field-input"
              placeholder="Nombre de usuario"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Contraseña</label>
          <div class="field-wrap">
            <svg class="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              class="field-input"
              placeholder="Contraseña"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-pass" @click="showPass = !showPass">
              <svg v-if="!showPass" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <button class="btn-login" :class="{ loading: isLoading }" type="submit">
          <span v-if="!isLoading">Iniciar sesión</span>
          <span v-else class="btn-spinner"></span>
        </button>
      </form>

      <!-- Demo credentials -->
      <div class="demo-section">
        <p class="demo-title">Cuentas de demostración</p>
        <div class="demo-cards">
          <button class="demo-card admin" @click="fillDemo('admin')">
            <div class="demo-avatar">CM</div>
            <div>
              <p class="demo-name">Dr. Carlos Mendoza</p>
              <p class="demo-role">Administrador</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button class="demo-card user" @click="fillDemo('usuario')">
            <div class="demo-avatar user">AG</div>
            <div>
              <p class="demo-name">Ana García</p>
              <p class="demo-role">Usuario</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const showPass = ref(false)

function fillDemo(role: 'admin' | 'usuario') {
  if (role === 'admin') {
    username.value = 'Dr. Carlos Mendoza'
    password.value = 'admin123'
  } else {
    username.value = 'Ana García'
    password.value = 'usuario123'
  }
  error.value = ''
}

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Por favor ingresa usuario y contraseña.'
    return
  }
  isLoading.value = true
  error.value = ''
  await new Promise(r => setTimeout(r, 600))
  const ok = login(username.value, password.value)
  isLoading.value = false
  if (ok) {
    router.push('/')
  } else {
    error.value = 'Credenciales incorrectas. Intenta con las cuentas demo.'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
}

.login-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}
.glow-1 {
  width: 500px; height: 500px;
  background: #3b82f6;
  top: -100px; left: -100px;
}
.glow-2 {
  width: 400px; height: 400px;
  background: #6366f1;
  bottom: -80px; right: -80px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  position: relative;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.logo-pulse {
  width: 52px; height: 52px;
  background: linear-gradient(135deg, var(--accent), #6366f1);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 0 28px var(--accent-glow);
  flex-shrink: 0;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3); }
  50% { box-shadow: 0 0 40px rgba(59,130,246,0.6); }
}

.login-title { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
.login-subtitle { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem; }

.divider { height: 1px; background: var(--border); margin-bottom: 1.5rem; }

.login-error {
  display: flex; align-items: center; gap: 0.5rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: var(--radius-sm);
  color: #fca5a5;
  font-size: 0.8rem;
  padding: 0.6rem 0.85rem;
  margin-bottom: 1rem;
}

.login-form { display: flex; flex-direction: column; gap: 1rem; }

.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }

.field-wrap {
  position: relative;
  display: flex; align-items: center;
}

.field-icon {
  position: absolute; left: 0.8rem;
  color: var(--text-muted); pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.65rem 2.75rem 0.65rem 2.25rem;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}
.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.field-input::placeholder { color: var(--text-muted); }

.toggle-pass {
  position: absolute; right: 0.8rem;
  background: transparent; border: none;
  color: var(--text-muted); cursor: pointer;
  padding: 0.2rem;
  transition: color 0.15s;
}
.toggle-pass:hover { color: var(--text-secondary); }

.btn-login {
  display: flex; align-items: center; justify-content: center;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: var(--accent);
  border: none; border-radius: var(--radius-sm);
  color: white; font-family: var(--font-body);
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 20px var(--accent-glow);
  min-height: 44px;
}
.btn-login:hover { background: #2563eb; transform: translateY(-1px); }
.btn-login.loading { opacity: 0.7; cursor: default; transform: none; }

.btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.demo-section { margin-top: 1.75rem; }
.demo-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.6rem; }

.demo-cards { display: flex; flex-direction: column; gap: 0.5rem; }

.demo-card {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%; padding: 0.65rem 0.85rem;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); cursor: pointer;
  transition: all 0.15s; text-align: left;
}
.demo-card:hover { border-color: var(--border-strong); background: var(--bg-card-hover); }
.demo-card svg { margin-left: auto; color: var(--text-muted); }

.demo-card.admin:hover { border-color: rgba(59,130,246,0.4); }
.demo-card.user:hover { border-color: rgba(16,185,129,0.4); }

.demo-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700; color: white; flex-shrink: 0;
}
.demo-avatar.user { background: linear-gradient(135deg, #10b981, #059669); }

.demo-name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
.demo-role { font-size: 0.68rem; color: var(--text-muted); margin-top: 0.05rem; }

/* Shake animation for error */
.shake-enter-active { animation: shake 0.4s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
</style>