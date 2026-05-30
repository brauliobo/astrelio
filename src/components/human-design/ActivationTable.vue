<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { HD_PLANETS } from '../../lib/human-design/constants.js'
import { activationCode } from '../../lib/human-design/activations.js'
import CelestialGlyph from '../common/CelestialGlyph.vue'

const props = defineProps({
  chart:         { type: Object, required: true },
  glyphRenderer: { type: String, default: null },
})
const { t } = useI18n()

const rows = computed(() =>
  HD_PLANETS.map(planet => ({
    planet,
    personality: props.chart.personality[planet],
    design:      props.chart.design[planet],
  })).filter(row => row.personality || row.design)
)
</script>

<template lang="pug">
.ui-panel(data-testid='human-design-activation-table')
  h2.text-sm.font-semibold.text-slate-100.mb-4 {{ t('human_design.activations') }}
  .overflow-x-auto
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr.border-b(class='border-white/10')
          th.py-2.pr-3.text-left {{ t('human_design.planet') }}
          th.py-2.px-3.text-left {{ t('human_design.personality') }}
          th.py-2.pl-3.text-left {{ t('human_design.design') }}
      tbody.divide-y(class='divide-white/10')
        tr(v-for='row in rows' :key='row.planet' :data-testid='`hd-activation-${row.planet}`')
          td.py-2.pr-3.text-slate-200
            .flex.items-center.gap-2
              CelestialGlyph(:reference='row.planet' :renderer='glyphRenderer' :size='18' :weight='700')
              span {{ t(`planets.${row.planet}`) }}
          td.py-2.px-3.text-amber-200 {{ row.personality ? activationCode(row.personality) : '—' }}
          td.py-2.pl-3.text-sky-200 {{ row.design ? activationCode(row.design) : '—' }}
</template>
