<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ aspects: { type: Array, required: true } })
const { t } = useI18n()

const colorOf = (type) => ({
  conjunction: 'text-slate-200',
  opposition:  'text-rose-300',
  trine:       'text-sky-300',
  square:      'text-rose-400',
  sextile:     'text-emerald-300',
  quincunx:    'text-amber-300'
}[type] || 'text-slate-300')

const rows = computed(() => props.aspects.map(a => ({
  ...a,
  label: t(`aspects.${a.type}`),
  pa:    t(`planets.${a.a}`),
  pb:    t(`planets.${a.b}`),
  delta: a.delta.toFixed(2)
})))
</script>

<template lang="pug">
.aspects(data-testid='aspect-table')
  .text-sm.text-slate-400.mb-2 {{ t('chart.summary') }}
  table.w-full.text-sm
    tbody
      tr.border-t(class='border-white/5' v-for='r in rows' :key='`${r.a}-${r.b}-${r.type}`' :class='colorOf(r.type)')
        td.py-1.pr-2 {{ r.pa }}
        td.py-1.px-2.text-center {{ r.label }}
        td.py-1.px-2 {{ r.pb }}
        td.py-1.pl-2.text-right.text-slate-400.tabular-nums {{ r.delta }}°
</template>
