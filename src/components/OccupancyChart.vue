<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import type { SimulationPoint } from '@/models/occupancyModel'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  points: SimulationPoint[]
  horizon: number
}>()

const chartData = computed(() => {
  const labels = props.points.map(p =>
    props.horizon === 0 ? 'Ahora' : `${p.time}h`
  )
  const values = props.points.map(p => parseFloat(p.occupancyRate.toFixed(1)))

  // Gradient color based on value
  return {
    labels,
    datasets: [
      {
        label: 'Ocupación (%)',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: (ctx: any) => {
          const canvas = ctx.chart.ctx
          const gradient = canvas.createLinearGradient(0, 0, 0, 300)
          gradient.addColorStop(0, 'rgba(59,130,246,0.3)')
          gradient.addColorStop(1, 'rgba(59,130,246,0.01)')
          return gradient
        },
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: props.points.length < 15 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#0a0f1e',
        pointBorderWidth: 2,
      },
      // Línea de referencia 85% (saturación)
      {
        label: 'Umbral saturación',
        data: Array(props.points.length).fill(85),
        borderColor: 'rgba(249,115,22,0.5)',
        borderDash: [6, 3],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#94a3b8',
        font: { family: 'DM Sans', size: 12 },
        boxWidth: 12,
        boxHeight: 2,
        usePointStyle: false,
      },
    },
    tooltip: {
      backgroundColor: '#1a2236',
      borderColor: 'rgba(99,155,255,0.2)',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      titleFont: { family: 'Space Mono', size: 12 },
      bodyFont: { family: 'DM Sans', size: 12 },
      padding: 12,
      callbacks: {
        label: (ctx: any) => {
          if (ctx.datasetIndex === 0)
            return `  Ocupación: ${ctx.parsed.y.toFixed(1)}%`
          return undefined
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(99,155,255,0.06)' },
      ticks: {
        color: '#4b5979',
        font: { family: 'Space Mono', size: 10 },
        maxTicksLimit: 12,
      },
    },
    y: {
      min: 0, max: 105,
      grid: { color: 'rgba(99,155,255,0.06)' },
      ticks: {
        color: '#4b5979',
        font: { family: 'Space Mono', size: 10 },
        callback: (v: any) => `${v}%`,
      },
    },
  },
}))
</script>

<style scoped>
.chart-wrap {
  position: relative;
  height: 280px;
  width: 100%;
}
</style>
