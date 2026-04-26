<template>
  <div class="location-panel card">
    <!-- Header -->
    <div class="location-header">
      <div class="location-title-wrap">
        <div class="location-icon" :style="{ background: typeColors[hospital.type] }">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
          </svg>
        </div>
        <div>
          <h3 class="location-title">Ubicación del hospital</h3>
          <p class="location-sub">{{ hospital.name }} · {{ hospital.city }}</p>
        </div>
      </div>
      <div class="coords-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span class="mono coords-text">
          {{ hospital.lat.toFixed(4) }}°N, {{ Math.abs(hospital.lng).toFixed(4) }}°O
        </span>
      </div>
    </div>

    <!-- Mapa -->
    <div class="location-map-wrap">
      <div ref="mapContainer" class="location-map"></div>

      <!-- Fallback sin token de Mapbox -->
      <div v-if="!mapReady" class="location-fallback">
        <div class="fallback-content">
          <div class="fallback-pin" :style="{ background: typeColors[hospital.type] }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/>
            </svg>
          </div>
          <p class="fallback-hosp-name">{{ hospital.name }}</p>
          <p class="fallback-city">{{ hospital.city }}</p>
          <div class="fallback-coords mono">
            {{ hospital.lat.toFixed(5) }}, {{ hospital.lng.toFixed(5) }}
          </div>
          <p class="fallback-hint">
            Agrega tu token de Mapbox en <code>.env</code> para ver el mapa interactivo
          </p>
          <a
            :href="`https://www.google.com/maps?q=${hospital.lat},${hospital.lng}`"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-open-maps"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Ver en Google Maps
          </a>
        </div>
      </div>

      <!-- Overlay cuando Mapbox está listo -->
      <div v-if="mapReady" class="map-info-overlay">
        <div class="map-info-card">
          <div class="map-info-dot" :style="{ background: typeColors[hospital.type] }"></div>
          <div>
            <p class="map-info-name">{{ hospital.name }}</p>
            <p class="map-info-city">{{ hospital.city }} · {{ hospital.type }}</p>
          </div>
        </div>
        <a
          :href="`https://www.google.com/maps?q=${hospital.lat},${hospital.lng}`"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-maps-overlay"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Maps
        </a>
      </div>
    </div>

    <!-- Info row debajo del mapa — FIX: colores explícitos para que los números sean visibles -->
    <div class="location-info-row">
      <div class="loc-info-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
        <span class="loc-info-label">Tipo</span>
        <span class="loc-info-val" :style="{ color: typeColors[hospital.type] }">{{ hospital.type }}</span>
      </div>
      <div class="loc-info-divider"></div>
      <div class="loc-info-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <span class="loc-info-label">Pacientes actuales</span>
        <span class="loc-info-val mono" style="color: var(--text-primary)">{{ hospital.currentPatients }}</span>
      </div>
      <div class="loc-info-divider"></div>
      <div class="loc-info-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span class="loc-info-label">Ocupación actual</span>
        <span class="loc-info-val mono" :style="{ color: occColor }">
          {{ occupancy.toFixed(1) }}%
        </span>
      </div>
      <div class="loc-info-divider"></div>
      <div class="loc-info-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="loc-info-label">Capacidad total</span>
        <span class="loc-info-val mono" style="color: var(--text-primary)">{{ hospital.capacity }} camas</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { type Hospital, hospitalOccupancy } from '@/services/hospitals'

const props = defineProps<{ hospital: Hospital }>()

const typeColors: Record<Hospital['type'], string> = {
  IMSS: '#3b82f6',
  ISSSTE: '#8b5cf6',
  SSA: '#10b981',
  Privado: '#f59e0b',
}

const mapContainer = ref<HTMLDivElement | null>(null)
const mapReady = ref(false)
let mapInstance: any = null
let marker: any = null

const occupancy = computed(() => hospitalOccupancy(props.hospital))

const occColor = computed((): string => {
  const pct = occupancy.value
  if (pct < 75) return '#10b981'
  if (pct < 85) return '#f59e0b'
  if (pct < 95) return '#f97316'
  return '#ef4444'
})

// ── Helpers del popup ──────────────────────────────────────
function buildPopupHtml(h: Hospital, color: string): string {
  const occ = hospitalOccupancy(h)
  const oc = occ < 75 ? '#10b981' : occ < 85 ? '#f59e0b' : occ < 95 ? '#f97316' : '#ef4444'
  return `
    <div style="font-family:'DM Sans',sans-serif; padding:6px; min-width:200px">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;box-shadow:0 0 6px ${color}"></div>
        <span style="font-size:11px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:0.05em">${h.type}</span>
      </div>
      <p style="font-weight:700;font-size:14px;color:#e2e8f0;margin:0 0 4px;line-height:1.3">${h.name}</p>
      <p style="font-size:12px;color:#94a3b8;margin:0 0 10px">${h.city}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div style="background:rgba(59,130,246,0.1);padding:6px 8px;border-radius:6px;border:1px solid rgba(59,130,246,0.2)">
          <p style="font-size:10px;color:#64748b;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em">Capacidad</p>
          <p style="font-size:14px;font-weight:700;color:#e2e8f0;margin:0;font-family:'Space Mono',monospace">${h.capacity}</p>
        </div>
        <div style="background:rgba(59,130,246,0.1);padding:6px 8px;border-radius:6px;border:1px solid rgba(59,130,246,0.2)">
          <p style="font-size:10px;color:#64748b;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em">Ocupación</p>
          <p style="font-size:14px;font-weight:700;color:${oc};margin:0;font-family:'Space Mono',monospace">${occ.toFixed(0)}%</p>
        </div>
      </div>
    </div>
  `
}

function buildMarkerEl(color: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid white;
    transform:rotate(-45deg);
    box-shadow:0 4px 16px ${color}88, 0 0 0 6px ${color}33;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  `
  const inner = document.createElement('div')
  inner.style.cssText = `
    width:14px;height:14px;transform:rotate(45deg);
    display:flex;align-items:center;justify-content:center;
  `
  inner.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
    <path d="M12 5v14M5 12h14"/>
  </svg>`
  el.appendChild(inner)
  return el
}

// ── Inicializar o actualizar el mapa ──────────────────────
async function initOrUpdate(h: Hospital) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  if (!token) return

  const color = typeColors[h.type]

  // Si el mapa ya existe solo actualizamos posición y marcador
  if (mapInstance) {
    mapInstance.flyTo({ center: [h.lng, h.lat], zoom: 14, duration: 1200, essential: true })

    if (marker) {
      // Crear nuevo elemento con el color correcto del nuevo hospital
      const newEl = buildMarkerEl(color)
      marker.remove()
      const mapboxgl = (await import('mapbox-gl')).default
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '240px' })
        .setHTML(buildPopupHtml(h, color))
      marker = new mapboxgl.Marker({ element: newEl, anchor: 'bottom' })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(mapInstance)
      marker.togglePopup()
    }
    return
  }

  // Primera vez: crear el mapa desde cero
  await nextTick()
  if (!mapContainer.value) return

  try {
    const mapboxgl = (await import('mapbox-gl')).default
    await import('mapbox-gl/dist/mapbox-gl.css')

    mapboxgl.accessToken = token

    mapInstance = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [h.lng, h.lat],
      zoom: 14,
    })

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    mapInstance.on('load', () => {
      const el = buildMarkerEl(color)
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '240px' })
        .setHTML(buildPopupHtml(h, color))
      marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(mapInstance)
      marker.togglePopup()
      mapReady.value = true
    })
  } catch (e) {
    console.warn('[Mapbox Location] No se pudo inicializar:', e)
  }
}

watch(() => props.hospital, (h) => {
  initOrUpdate(h)
}, { immediate: true })

onUnmounted(() => {
  if (mapInstance) { mapInstance.remove(); mapInstance = null; marker = null }
})
</script>

<style scoped>
.location-panel { margin-bottom: 2rem; padding: 0; overflow: hidden; }

/* Header */
.location-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.1rem 1.5rem; border-bottom: 1px solid var(--border);
  flex-wrap: wrap; gap: 0.75rem;
}
.location-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.location-icon {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.location-title { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin: 0; }
.location-sub {
  font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px;
}
.coords-badge {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.7rem; background: var(--bg-input);
  border: 1px solid var(--border); border-radius: 100px;
  color: var(--text-muted); flex-shrink: 0;
}
.coords-text { font-size: 0.68rem; }

/* Mapa */
.location-map-wrap {
  position: relative; width: 100%; height: 400px;
  background: var(--bg-input); overflow: hidden;
}
.location-map { width: 100%; height: 100%; }

/* Fallback */
.location-fallback {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, var(--bg-input) 70%);
}
.fallback-content {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.6rem; text-align: center; padding: 2rem; max-width: 320px;
}
.fallback-pin {
  width: 52px; height: 52px; border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 0.5rem;
}
.fallback-pin svg { transform: rotate(45deg); }
.fallback-hosp-name { font-size: 1rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
.fallback-city { font-size: 0.8rem; color: var(--text-secondary); }
.fallback-coords {
  font-size: 0.72rem; color: var(--text-muted);
  background: var(--bg-card); border: 1px solid var(--border);
  padding: 0.3rem 0.75rem; border-radius: 100px;
}
.fallback-hint { font-size: 0.72rem; color: var(--text-muted); line-height: 1.5; margin-top: 0.25rem; }
.fallback-hint code { color: var(--text-accent); font-family: var(--font-mono); font-size: 0.7rem; }
.btn-open-maps {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; background: var(--accent-glow);
  border: 1px solid rgba(59,130,246,0.4); border-radius: var(--radius-sm);
  color: var(--text-accent); font-size: 0.8rem; font-weight: 600;
  font-family: var(--font-body); text-decoration: none; transition: all 0.15s; margin-top: 0.25rem;
}
.btn-open-maps:hover { background: rgba(59,130,246,0.2); border-color: var(--accent); }

/* Overlay sobre el mapa */
.map-info-overlay {
  position: absolute; bottom: 14px; left: 14px;
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
}
.map-info-card {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.85rem;
  background: rgba(17,24,39,0.92); backdrop-filter: blur(10px);
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
}
.map-info-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.map-info-name { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin: 0; white-space: nowrap; }
.map-info-city { font-size: 0.68rem; color: var(--text-muted); margin: 0; white-space: nowrap; }
.btn-maps-overlay {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.75rem; background: rgba(17,24,39,0.92);
  backdrop-filter: blur(10px); border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm); color: var(--text-accent);
  font-size: 0.72rem; font-weight: 600; font-family: var(--font-body);
  text-decoration: none; transition: all 0.15s;
}
.btn-maps-overlay:hover { background: var(--accent-glow); border-color: var(--accent); }

/* ── Info row — FIX visibilidad de números ─────────────────
   Antes: loc-info-val heredaba el color gris del contenedor.
   Ahora: colores explícitos garantizan contraste en todos los temas. */
.location-info-row {
  display: flex; align-items: center;
  padding: 0.85rem 1.5rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap; gap: 0;
}
.loc-info-item {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0 1rem; flex: 1; min-width: 120px; color: var(--text-muted);
}
.loc-info-item svg { flex-shrink: 0; color: var(--text-muted); }
.loc-info-label { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; }
/* FIX: valor con color claro siempre visible */
.loc-info-val {
  font-size: 0.85rem;      /* un toque más grande */
  font-weight: 700;         /* negrita para destacar */
  color: var(--text-primary); /* blanco/claro por defecto */
  margin-left: auto;
}
.loc-info-divider { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 1023px) {
  .location-map-wrap { height: 340px; }
  .location-sub { max-width: 240px; }
}
@media (max-width: 767px) {
  .location-header { padding: 0.9rem 1rem; flex-direction: column; align-items: flex-start; gap: 0.6rem; }
  .location-title { font-size: 0.85rem; }
  .location-sub { font-size: 0.68rem; max-width: 100%; }
  .coords-badge { padding: 0.25rem 0.55rem; }
  .coords-text { font-size: 0.62rem; }
  .location-map-wrap { height: 260px; }
  .map-info-city { display: none; }
  .map-info-name { font-size: 0.75rem; }

  /* Info row: grid 2 col en móvil */
  .location-info-row {
    padding: 0.75rem 1rem;
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
  }
  .loc-info-divider { display: none; }
  .loc-info-item {
    padding: 0.5rem 0.6rem; flex: unset; min-width: unset;
    background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm);
  }
  .loc-info-val { margin-left: auto; font-size: 0.78rem; }

  /* Fallback compacto */
  .fallback-content { padding: 1.5rem 1rem; gap: 0.45rem; }
  .fallback-pin { width: 44px; height: 44px; }
  .fallback-hosp-name { font-size: 0.9rem; }
  .fallback-hint { font-size: 0.68rem; }
  .btn-open-maps { font-size: 0.75rem; padding: 0.45rem 0.85rem; }
}
@media (max-width: 479px) {
  .location-map-wrap { height: 220px; }
  .location-info-row { grid-template-columns: 1fr; }
}
</style>