<script setup>
import { computed } from 'vue'
import { CENTER_COORDS, CENTERS, CHANNEL_CENTERS } from '../../lib/human-design/constants.js'

const props = defineProps({
  chart: { type: Object, required: true },
})

const definedCenters = computed(() => new Set(props.chart.centers || []))
const definedChannels = computed(() => new Set(props.chart.channels || []))

const channelLines = computed(() =>
  Object.entries(CHANNEL_CENTERS).map(([channel, centers]) => ({
    channel,
    a: CENTER_COORDS[centers[0]],
    b: CENTER_COORDS[centers[1]],
    defined: definedChannels.value.has(channel),
  }))
)

const centerRows = computed(() =>
  CENTERS.map(center => ({
    name: center,
    shape: CENTER_COORDS[center],
    defined: definedCenters.value.has(center),
  }))
)
</script>

<template lang="pug">
.bodygraph-chart(data-testid='bodygraph-chart')
  svg.block.mx-auto.max-w-full(
    viewBox='0 0 500 640'
    role='img'
    aria-label='Human Design bodygraph'
    data-testid='bodygraph-svg'
  )
    g(data-testid='bodygraph-channels')
      line(
        v-for='line in channelLines'
        :key='line.channel'
        :x1='line.a.x'
        :y1='line.a.y'
        :x2='line.b.x'
        :y2='line.b.y'
        :stroke='line.defined ? "#f59e0b" : "#334155"'
        :stroke-width='line.defined ? 8 : 4'
        :stroke-opacity='line.defined ? 0.84 : 0.28'
        stroke-linecap='round'
        :data-channel='line.channel'
        :data-defined='String(line.defined)'
        :data-testid='line.defined ? "bodygraph-defined-channel" : "bodygraph-open-channel"'
      )
    g(data-testid='bodygraph-centers')
      g(
        v-for='center in centerRows'
        :key='center.name'
        :data-center='center.name'
        :data-defined='String(center.defined)'
        :data-testid='center.defined ? "bodygraph-defined-center" : "bodygraph-open-center"'
      )
        polygon(
          :points='center.shape.points'
          :fill='center.defined ? "#f8fafc" : "#111827"'
          :stroke='center.defined ? "#fbbf24" : "#64748b"'
          :stroke-width='center.defined ? 3 : 1.4'
        )
        text(
          :x='center.shape.x'
          :y='center.shape.y'
          text-anchor='middle'
          dominant-baseline='middle'
          :fill='center.defined ? "#0f172a" : "#cbd5e1"'
          font-size='13'
          font-weight='700'
        ) {{ center.name }}
  .mt-3.flex.flex-wrap.gap-2.text-xs
    span.rounded-full.px-2.py-1.text-slate-300(
      v-for='channel in chart.channels'
      :key='channel'
      class='bg-white/5'
      data-testid='bodygraph-channel-chip'
    ) {{ channel }}
</template>
