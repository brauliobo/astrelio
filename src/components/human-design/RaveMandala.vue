<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'
import { humanDesignValueLabel } from '../../lib/human-design/labels.js'

const props = defineProps({
  chart: { type: Object, required: true },
})
const { t } = useI18n()

const activeGates = computed(() => new Set(props.chart.gates || []))
const center = 260
const outer = 238
const inner = 170
const labelRadius = 218

const polar = (radius, angle) => {
  const radians = (angle - 90) * Math.PI / 180
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  }
}

const gates = computed(() =>
  MANDALA_GATE_ORDER.map((gate, index) => {
    const start = index * 360 / 64
    const mid = start + (360 / 128)
    const a = polar(inner, start)
    const b = polar(outer, start)
    const label = polar(labelRadius, mid)
    return {
      gate,
      active: activeGates.value.has(gate),
      line: { a, b },
      label,
      rotate: mid,
    }
  })
)
</script>

<template lang="pug">
.rave-mandala(data-testid='rave-mandala')
  svg.block.mx-auto.max-w-full(viewBox='0 0 520 520' role='img' :aria-label='t("human_design.rave_mandala_aria")')
    circle(:cx='center' :cy='center' :r='outer' fill='rgba(15,23,42,0.72)' stroke='#64748b' stroke-width='1')
    circle(:cx='center' :cy='center' :r='inner' fill='none' stroke='#64748b' stroke-width='1' stroke-opacity='0.45')
    g
      line(
        v-for='item in gates'
        :key='`line-${item.gate}`'
        :x1='item.line.a.x'
        :y1='item.line.a.y'
        :x2='item.line.b.x'
        :y2='item.line.b.y'
        :stroke='item.active ? "#f59e0b" : "#475569"'
        :stroke-width='item.active ? 2 : 0.8'
        :stroke-opacity='item.active ? 0.95 : 0.5'
      )
    g
      text(
        v-for='item in gates'
        :key='item.gate'
        :x='item.label.x'
        :y='item.label.y'
        text-anchor='middle'
        dominant-baseline='middle'
        :fill='item.active ? "#fbbf24" : "#cbd5e1"'
        :font-size='item.active ? 12 : 9'
        :font-weight='item.active ? 800 : 500'
        :data-gate='item.gate'
        :data-active='String(item.active)'
        data-testid='mandala-gate'
      ) {{ item.gate }}
    circle(:cx='center' :cy='center' r='124' fill='rgba(2,6,23,0.72)' stroke='#334155')
    text(:x='center' :y='center - 10' text-anchor='middle' fill='#e2e8f0' font-size='18' font-weight='700') {{ humanDesignValueLabel(t, 'type', chart.type) }}
    text(:x='center' :y='center + 18' text-anchor='middle' fill='#94a3b8' font-size='12') {{ chart.profile }} · {{ humanDesignValueLabel(t, 'authority', chart.authority) }}
</template>
