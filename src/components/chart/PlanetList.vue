<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { houseOf } from '../../lib/astro/houses.js'
import { signIndex, degInSign, norm360 } from '../../lib/astro/zodiac.js'

const props = defineProps({ chart: { type: Object, required: true } })
const { t, tm } = useI18n()
const signs = computed(() => tm('zodiac.signs'))

const fmt = (lon) => {
  const d  = degInSign(lon)
  const dd = Math.floor(d)
  const mm = Math.floor((d - dd) * 60)
  return `${dd}° ${mm.toString().padStart(2, '0')}'`
}

const rows = computed(() =>
  props.chart.positions.map(p => ({
    name:  p.name,
    label: t(`planets.${p.name}`),
    sign:  signs.value[signIndex(p.longitude)],
    deg:   fmt(p.longitude),
    house: houseOf(p.longitude, props.chart.cusps),
    retro: p.retrograde
  }))
)

const ascSign = computed(() => signs.value[signIndex(props.chart.ascendant)])
const mcSign  = computed(() => signs.value[signIndex(props.chart.mc)])
const _ = norm360
</script>

<template lang="pug">
.planet-list.text-sm(data-testid='planet-list')
  .grid.grid-cols-2.gap-y-1.gap-x-3.mb-3
    .text-slate-400 {{ t('chart.asc') }}
    .text-slate-100.font-medium(data-testid='asc-sign') {{ ascSign }} {{ fmt(chart.ascendant) }}
    .text-slate-400 {{ t('chart.mc') }}
    .text-slate-100.font-medium(data-testid='mc-sign') {{ mcSign }} {{ fmt(chart.mc) }}
  table.w-full
    tbody
      tr.border-t(class='border-white/5' v-for='r in rows' :key='r.name' :data-testid='`planet-${r.name}`')
        td.py-1.pr-2.text-slate-300 {{ r.label }}
        td.py-1.px-2.text-slate-100 {{ r.sign }}
        td.py-1.px-2.tabular-nums {{ r.deg }}
        td.py-1.px-2.text-slate-400 {{ t('chart.house_system') ? '' : '' }} {{ r.house }}
        td.py-1.pl-2.text-amber-300(v-if='r.retro') ℞
</template>
