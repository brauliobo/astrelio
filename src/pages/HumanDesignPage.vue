<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { modalityChart } from '../lib/modalities/index.js'
import { humanDesignValueLabel } from '../lib/human-design/labels.js'
import ActivationTable from '../components/human-design/ActivationTable.vue'
import InsightPanel from '../components/human-design/InsightPanel.vue'
import Wheel from '../components/human-design/Wheel.vue'
import ModalityRouteSwitch from '../components/modalities/ModalityRouteSwitch.vue'

const { t } = useI18n()
const people = usePeopleStore()
const session = useSessionStore()
const settings = useSettingsStore()

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const chart = computed(() => modalityChart('humanDesign', person.value))
const summaryRows = computed(() => chart.value ? [
  { label: t('human_design.type'), value: humanDesignValueLabel(t, 'type', chart.value.type), testId: 'hd-type' },
  { label: t('human_design.authority'), value: humanDesignValueLabel(t, 'authority', chart.value.authority), testId: 'hd-authority' },
  { label: t('human_design.profile'), value: chart.value.profile, testId: 'hd-profile' },
  { label: t('human_design.definition'), value: humanDesignValueLabel(t, 'definition', chart.value.definition), testId: 'hd-definition' },
] : [])
</script>

<template lang="pug">
section.human-design-page(data-testid='human-design-page')
  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}
  div.grid.gap-6(v-else-if='chart')
    .flex.flex-wrap.items-start.justify-between.gap-3
      div
        h1.text-2xl.font-semibold.text-slate-100 {{ t('human_design.title', { name: person.name }) }}
        p.text-xs.text-slate-400.mt-1 {{ t('human_design.subtitle') }}
      ModalityRouteSwitch(active='humanDesign')

    .grid.gap-3(class='sm:grid-cols-2 lg:grid-cols-4')
      .rounded.border.p-3(
        v-for='row in summaryRows'
        :key='row.testId'
        class='border-white/10 bg-white/5'
      )
        .text-xs.uppercase.tracking-wide.text-slate-500 {{ row.label }}
        .mt-1.text-lg.font-semibold.text-slate-100(:data-testid='row.testId') {{ row.value }}

    .ui-panel
      Wheel(
        :chart='chart'
        :visual-theme='settings.theme'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )

    InsightPanel(:chart='chart')
    ActivationTable(:chart='chart' :glyph-renderer='settings.planetGlyphRenderer')
</template>
