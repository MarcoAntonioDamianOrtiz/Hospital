<template>
    <div class="map-panel card">
        <div class="map-header">
            <div>
                <h2 class="panel-title">Seleccionar Hospital</h2>
                <p class="map-sub">Elige un hospital del mapa o de la lista para cargar sus datos</p>
            </div>
            <button class="btn-close" @click="$emit('close')" aria-label="Cerrar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>

        <div class="map-body">
            <!-- ── Mapa Mapbox ──────────────────────────────── -->
            <div class="map-container">
                <div ref="mapContainer" class="mapbox-map"></div>

                <!-- Estado cuando Mapbox no está configurado -->
                <div v-if="!mapboxReady" class="map-fallback">
                    <div class="fallback-inner">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" opacity="0.5">
                            <circle cx="12" cy="10" r="3" />
                            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z" />
                        </svg>
                        <p class="fallback-title">Mapa interactivo</p>
                        <p class="fallback-sub">
                            Para activar el mapa, añade tu token de Mapbox al archivo <code>.env</code>:
                        </p>
                        <code class="code-block">VITE_MAPBOX_TOKEN=pk.eyJ1Ijo...</code>
                        <p class="fallback-sub" style="margin-top:0.5rem">Mientras tanto, selecciona un hospital de la
                            lista.</p>
                    </div>
                </div>

                <!-- Leyenda del mapa -->
                <div v-if="mapboxReady" class="map-legend">
                    <div v-for="(color, type) in typeColors" :key="type" class="legend-item">
                        <span class="legend-dot" :style="{ background: color }"></span>
                        <span>{{ type }}</span>
                    </div>
                </div>
            </div>

            <!-- ── Lista de hospitales ─────────────────────── -->
            <div class="hospital-list">
                <!-- Buscador -->
                <div class="search-wrap">
                    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input v-model="searchQuery" type="text" class="search-input"
                        placeholder="Buscar hospital o ciudad..." />
                </div>

                <!-- Items -->
                <div class="list-items">
                    <button v-for="hospital in filteredHospitals" :key="hospital.id" class="hospital-item"
                        :class="{ selected: selectedId === hospital.id }" @click="selectHospital(hospital)">
                        <div class="hosp-top">
                            <span class="type-badge"
                                :style="{ background: typeColors[hospital.type] + '22', color: typeColors[hospital.type], borderColor: typeColors[hospital.type] + '55' }">
                                {{ hospital.type }}
                            </span>
                            <span class="hosp-city">{{ hospital.city }}</span>
                        </div>
                        <p class="hosp-name">{{ hospital.name }}</p>
                        <div class="hosp-stats">
                            <div class="hosp-stat">
                                <span class="stat-label">Camas</span>
                                <span class="stat-val mono">{{ hospital.capacity }}</span>
                            </div>
                            <div class="hosp-stat">
                                <span class="stat-label">Ocupación</span>
                                <span class="stat-val mono" :style="{ color: occupancyColor(hospital) }">
                                    {{ occupancyPct(hospital).toFixed(0) }}%
                                </span>
                            </div>
                            <div class="hosp-occ-bar">
                                <div class="occ-fill"
                                    :style="{ width: occupancyPct(hospital) + '%', background: occupancyColor(hospital) }">
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                <!-- Botón confirmar -->
                <button class="btn-confirm" :disabled="!selectedHospital" @click="confirmSelection">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {{ selectedHospital ? `Usar ${selectedHospital.name}` : 'Selecciona un hospital' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { HOSPITALS, hospitalOccupancy, type Hospital } from '@/services/hospitals'

const emit = defineEmits<{
    (e: 'select', hospital: Hospital): void
    (e: 'close'): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const mapboxReady = ref(false)
const selectedId = ref<string | null>(null)
const selectedHospital = ref<Hospital | null>(null)
const searchQuery = ref('')

const typeColors: Record<Hospital['type'], string> = {
    IMSS: '#3b82f6',
    ISSSTE: '#8b5cf6',
    SSA: '#10b981',
    Privado: '#f59e0b',
}

const filteredHospitals = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return HOSPITALS
    return HOSPITALS.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q)
    )
})

function occupancyPct(h: Hospital) { return hospitalOccupancy(h) }

function occupancyColor(h: Hospital): string {
    const pct = hospitalOccupancy(h)
    if (pct < 75) return '#10b981'
    if (pct < 85) return '#f59e0b'
    if (pct < 95) return '#f97316'
    return '#ef4444'
}

function selectHospital(h: Hospital) {
    selectedId.value = h.id
    selectedHospital.value = h
    if (mapInstance) {
        mapInstance.flyTo({ center: [h.lng, h.lat], zoom: 13, duration: 1000 })
        highlightMarker(h.id)
    }
}

function confirmSelection() {
    if (selectedHospital.value) emit('select', selectedHospital.value)
}

// ── Mapbox ────────────────────────────────────────────────
let mapInstance: any = null
const markers: Map<string, any> = new Map()

function highlightMarker(id: string) {
    markers.forEach((marker, mId) => {
        const el = marker.getElement() as HTMLElement
        el.style.transform = mId === id ? 'scale(1.3)' : 'scale(1)'
        el.style.zIndex = mId === id ? '10' : '1'
    })
}

async function initMapbox() {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
    if (!token || !mapContainer.value) return

    try {
        const mapboxgl = (await import('mapbox-gl')).default
        await import('mapbox-gl/dist/mapbox-gl.css')

        mapboxgl.accessToken = token

        mapInstance = new mapboxgl.Map({
            container: mapContainer.value,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-98.5, 19.4],
            zoom: 7.5,
        })

        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')

        mapInstance.on('load', () => {
            HOSPITALS.forEach(h => {
                const el = document.createElement('div')
                el.style.cssText = `
          width: 12px; height: 12px;
          border-radius: 50%;
          background: ${typeColors[h.type]};
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 8px ${typeColors[h.type]}88;
          cursor: pointer;
          transition: transform 0.2s;
        `

                const popup = new mapboxgl.Popup({ offset: 14, closeButton: false })
                    .setHTML(`
            <div style="font-family:'DM Sans',sans-serif;padding:4px;min-width:160px">
              <p style="font-weight:700;font-size:13px;margin:0 0 4px">${h.name}</p>
              <p style="font-size:11px;color:#94a3b8;margin:0 0 6px">${h.city} · ${h.type}</p>
              <div style="display:flex;justify-content:space-between;font-size:11px">
                <span>Camas: <b>${h.capacity}</b></span>
                <span style="color:${occupancyColor(h)}">Ocupación: <b>${occupancyPct(h).toFixed(0)}%</b></span>
              </div>
            </div>
          `)

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([h.lng, h.lat])
                    .setPopup(popup)
                    .addTo(mapInstance)

                el.addEventListener('click', () => selectHospital(h))
                markers.set(h.id, marker)
            })

            mapboxReady.value = true
        })
    } catch (e) {
        console.warn('[Mapbox] No se pudo cargar el mapa:', e)
    }
}

onMounted(() => initMapbox())
onUnmounted(() => { if (mapInstance) mapInstance.remove() })
</script>

<style scoped>
/* ── Panel base ───────────────────────────────────────────── */
.map-panel {
    padding: 0;
    overflow: hidden;
}

/* ── Header ───────────────────────────────────────────────── */
.map-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.panel-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
}

.map-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.2rem;
}

.btn-close {
    padding: 0.35rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
    margin-top: 2px;
}
.btn-close:hover {
    border-color: #ef4444;
    color: #ef4444;
}

/* ── Body: mapa + lista lado a lado (desktop) ─────────────── */
.map-body {
    display: grid;
    grid-template-columns: 1fr 300px;
    /* altura fija en desktop */
    height: 480px;
    overflow: hidden;
}

/* ── Contenedor del mapa ─────────────────────────────────── */
.map-container {
    position: relative;
    background: #0a0f1e;
    border-right: 1px solid var(--border);
    overflow: hidden;
    /* altura mínima para que el mapa se renderice bien */
    min-height: 200px;
}

.mapbox-map {
    width: 100%;
    height: 100%;
}

/* ── Fallback sin token ──────────────────────────────────── */
.map-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
}

.fallback-inner {
    text-align: center;
    padding: 2rem;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
}

.fallback-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.fallback-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.5;
}

.code-block {
    display: block;
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: var(--text-accent);
    font-family: var(--font-mono);
}

/* ── Leyenda ─────────────────────────────────────────────── */
.map-legend {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(17, 24, 39, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    color: var(--text-secondary);
}

.legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

/* ── Lista de hospitales ─────────────────────────────────── */
.hospital-list {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    overflow: hidden;
    min-height: 0;
}

.search-wrap {
    position: relative;
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.search-icon {
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.1rem;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.8rem;
    outline: none;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--text-muted); }

.list-items {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    -webkit-overflow-scrolling: touch;
}

.hospital-item {
    width: 100%;
    text-align: left;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 0.3rem;
}
.hospital-item:hover {
    background: var(--bg-card);
    border-color: var(--border);
}
.hospital-item.selected {
    background: var(--accent-glow);
    border-color: rgba(59, 130, 246, 0.4);
}

.hosp-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.3rem;
}

.type-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 100px;
    border: 1px solid;
    letter-spacing: 0.05em;
}

.hosp-city {
    font-size: 0.7rem;
    color: var(--text-muted);
}

.hosp-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    margin-bottom: 0.5rem;
}

.hosp-stats {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
}

.hosp-stat {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.stat-label {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-val {
    font-size: 0.8rem;
    font-weight: 600;
}

.hosp-occ-bar {
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;
    min-width: 40px;
}

.occ-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s;
}

.btn-confirm {
    margin: 0.75rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    color: white;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 16px var(--accent-glow);
    /* truncar texto largo */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.btn-confirm:hover:not(:disabled) { background: #2563eb; }
.btn-confirm:disabled {
    background: var(--bg-card);
    color: var(--text-muted);
    box-shadow: none;
    cursor: default;
    border: 1px solid var(--border);
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════ */

/* ── Tablet (768px - 1023px) ─────────────────────────────── */
@media (max-width: 1023px) {
    /* Lista un poco más estrecha */
    .map-body {
        grid-template-columns: 1fr 260px;
        height: 460px;
    }

    /* Leyenda horizontal para ganar espacio vertical */
    .map-legend {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.4rem 0.75rem;
        bottom: 8px;
        left: 8px;
        right: 8px;
        padding: 0.4rem 0.6rem;
    }
}

/* ── Mobile (< 768px) ────────────────────────────────────── */
@media (max-width: 767px) {
    /* Header: sub-texto oculto para ahorrar espacio */
    .map-header {
        padding: 1rem 1.1rem;
    }
    .map-sub { display: none; }

    /* Body: mapa arriba, lista abajo (columna única) */
    .map-body {
        grid-template-columns: 1fr;
        grid-template-rows: 220px 1fr;
        height: auto;
        /* altura total controlada por el modal en DashboardView */
        max-height: calc(90vh - 60px);
        overflow: hidden;
    }

    /* Mapa: altura fija para que sea usable */
    .map-container {
        height: 220px;
        border-right: none;
        border-bottom: 1px solid var(--border);
    }

    /* Lista: ocupa el resto del espacio disponible */
    .hospital-list {
        height: 0;        /* necesario para que flex: 1 funcione dentro del grid */
        min-height: 280px;
        overflow: hidden;
    }

    /* Leyenda: horizontal compacta en móvil */
    .map-legend {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.3rem 0.6rem;
        bottom: 6px;
        left: 6px;
        right: 6px;
        padding: 0.35rem 0.5rem;
        font-size: 0.65rem;
    }
    .legend-dot { width: 6px; height: 6px; }

    /* Fallback: más compacto */
    .fallback-inner {
        padding: 1.25rem 1rem;
        gap: 0.4rem;
    }
    .fallback-title { font-size: 0.85rem; }
    .fallback-sub   { font-size: 0.72rem; }
    .code-block     { font-size: 0.68rem; }

    /* Items de hospital: padding reducido */
    .hospital-item { padding: 0.6rem; }
    .hosp-name { font-size: 0.78rem; }

    /* Botón confirmar */
    .btn-confirm {
        margin: 0.5rem 0.6rem;
        font-size: 0.78rem;
        padding: 0.55rem 0.75rem;
    }

    /* Buscador */
    .search-wrap { padding: 0.6rem; }
    .search-input { font-size: 0.78rem; padding: 0.45rem 0.75rem 0.45rem 2rem; }
}

/* ── Muy pequeño (< 480px) ───────────────────────────────── */
@media (max-width: 479px) {
    .map-body {
        grid-template-rows: 180px 1fr;
    }

    .map-container { height: 180px; }

    .hospital-list { min-height: 240px; }

    /* Leyenda: ocultar en pantallas muy pequeñas (el mapa es suficientemente pequeño) */
    .map-legend { display: none; }

    .map-header { padding: 0.85rem 1rem; }
    .panel-title { font-size: 0.85rem; }
}
</style>