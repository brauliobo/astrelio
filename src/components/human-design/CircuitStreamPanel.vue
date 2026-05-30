<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()

const groups = computed(() => {
  const map = new Map()
  for (const channel of props.chart.details?.channels || []) {
    const key = channel.circuitGroup || channel.circuit || 'Open'
    const item = map.get(key) || { key, channels: [] }
    item.channels.push(channel)
    map.set(key, item)
  }
  return [...map.values()].sort((left, right) => left.key.localeCompare(right.key))
})

const hangingGates = computed(() =>
  (props.chart.details?.gates || []).filter(gate => gate.isHanging)
)
</script>

<template lang="pug">
.hd-circuit-stream(data-testid='hd-circuit-stream')
  .flex.items-start.justify-between.gap-3.mb-4
    div
      h2.text-sm.font-semibold.text-slate-100 {{ t('human_design.circuit_stream') }}
      p.text-xs.text-slate-500.mt-1 {{ t('human_design.circuit_stream_note') }}

  .grid.gap-4(class='lg:grid-cols-2')
    section.rounded.border.p-3(class='border-white/10 bg-white/5')
      h3.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.defined_streams') }}
      .grid.gap-3(v-if='groups.length')
        article.rounded.border.p-3(
          v-for='group in groups'
          :key='group.key'
          class='border-white/10 bg-black/10'
        )
          .flex.items-center.justify-between.gap-2
            h4.text-sm.font-semibold.text-slate-100 {{ group.key }}
            span.text-xs.text-slate-500 {{ group.channels.length }}
          .mt-3.grid.gap-2
            .rounded.p-2.text-xs(
              v-for='channel in group.channels'
              :key='channel.channel'
              class='bg-white/5'
            )
              .font-semibold.text-slate-100 {{ channel.channel }} · {{ channel.name }}
              .mt-1.text-slate-400 {{ channel.circuit }} · {{ channel.centers?.join(' / ') || '—' }}
              .mt-1.flex.flex-wrap.gap-1
                span.rounded-full(
                  v-if='channel.isLove'
                  class='px-2 py-0.5 bg-amber-300/10 text-amber-100 text-[11px]'
                ) {{ t('human_design.love_theme') }}
                span.rounded-full(
                  v-if='channel.isMaterial'
                  class='px-2 py-0.5 bg-sky-300/10 text-sky-100 text-[11px]'
                ) {{ t('human_design.material_theme') }}
      p.text-xs.text-slate-500(v-else) {{ t('human_design.no_defined_channels') }}

    section.rounded.border.p-3(class='border-white/10 bg-white/5')
      h3.text-sm.font-semibold.text-slate-100.mb-3 {{ t('human_design.hanging_gates') }}
      .grid.gap-2(v-if='hangingGates.length')
        article.rounded.border.p-2(
          v-for='gate in hangingGates'
          :key='gate.gate'
          class='border-sky-300/20 bg-sky-300/10'
        )
          .flex.items-center.justify-between.gap-2
            .text-sm.font-semibold.text-slate-100 {{ gate.gate }} · {{ gate.name }}
            .text-xs.text-sky-100 {{ gate.center }}
          .mt-1.text-xs.text-slate-400 {{ t('human_design.harmonics') }}: {{ gate.hangingHarmonics?.join(', ') || '—' }}
      p.text-xs.text-slate-500(v-else) {{ t('human_design.no_hanging_gates') }}
</template>
