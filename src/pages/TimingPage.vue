<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { useSettingsStore } from '../stores/settings.js'
import { useNatalChart } from '../composables/useChart.js'
import { transitsFor } from '../lib/astro/transits.js'
import { secondaryProgression } from '../lib/astro/progressions.js'
import { solarReturnChartForNatal } from '../lib/astro/solar_return.js'
import { annualProfection } from '../lib/astro/profections.js'
import { solarArcDirections } from '../lib/astro/solar_arc.js'
import { lunarReturnChartForNatal } from '../lib/astro/lunar_return.js'
import { crossAspects, naturalAspects } from '../lib/astro/aspects.js'
import { localToJdUt, localToUtcMs, offsetMinutesForPerson } from '../lib/astro/timezones.js'
import Biwheel from '../components/chart/Biwheel.vue'
import AspectTable from '../components/chart/AspectTable.vue'
import AspectMatrix from '../components/chart/AspectMatrix.vue'
import Comparison from '../components/chart/Comparison.vue'
import Insight from '../components/chart/Insight.vue'
import ComparisonInsightPanel from '../components/chart/ComparisonInsightPanel.vue'

const props = defineProps({
  technique: { type: String, default: '' },
})

const { t, tm } = useI18n()
const route    = useRoute()
const router   = useRouter()
const people   = usePeopleStore()
const session  = useSessionStore()
const settings = useSettingsStore()

const techniqueOptions = [
  { id: 'transits', routeName: 'transits', label: () => t('nav.transits'), testid: 'timing-technique-transits' },
  { id: 'progressions', routeName: 'progressions', label: () => t('nav.progressions'), testid: 'timing-technique-progressions' },
  { id: 'solar-return', routeName: 'solar-return', label: () => t('nav.solar_return'), testid: 'timing-technique-solar-return' },
  { id: 'profections', routeName: 'profections', label: () => t('techniques.nav.profections'), testid: 'timing-technique-profections' },
  { id: 'solar-arc', routeName: 'solar-arc', label: () => t('techniques.nav.solar_arc'), testid: 'timing-technique-solar-arc' },
  { id: 'lunar-return', routeName: 'lunar-return', label: () => t('techniques.nav.lunar_return'), testid: 'timing-technique-lunar-return' },
]

const knownTechniqueIds = new Set(techniqueOptions.map(option => option.id))
const localTechnique    = ref('transits')

const normalizeTechnique = (value) => {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/^\//, '')

  if (knownTechniqueIds.has(normalized)) return normalized
  if (normalized === 'transit') return 'transits'
  if (normalized === 'progression') return 'progressions'
  for (const option of techniqueOptions) {
    if (normalized.includes(option.id)) return option.id
  }
  if (normalized === 'timing' || normalized === 'timing-default') return 'transits'
  return ''
}

const routeTechnique = computed(() => {
  const fromProp = normalizeTechnique(props.technique)
  if (fromProp) return fromProp

  const fromParam = normalizeTechnique(route?.params?.technique)
  if (fromParam) return fromParam

  const fromName = normalizeTechnique(route?.name)
  if (fromName) return fromName

  return normalizeTechnique(route?.path)
})

const activeTechnique = computed(() => routeTechnique.value || localTechnique.value)

const selectTechnique = (techniqueId) => {
  localTechnique.value = techniqueId
  const target         = techniqueOptions.find(option => option.id === techniqueId)
  if (!target || routeTechnique.value === techniqueId || !router?.hasRoute?.(target.routeName)) return
  router.push({ name: target.routeName })
}

const person = computed(() => people.byId(session.activePersonId) || people.sorted[0] || null)
const natal  = useNatalChart(person, settings)

const transitDateMs    = ref(session.transitDateMs || Date.now())
const transitDateInput = computed({
  get: () => new Date(transitDateMs.value).toISOString().slice(0, 16),
  set: (value) => {
    transitDateMs.value = new Date(value).getTime()
    session.setTransitDate(transitDateMs.value)
  },
})

const progressionDateMs    = ref(session.progressionDateMs || Date.now())
const progressionDateInput = computed({
  get: () => new Date(progressionDateMs.value).toISOString().slice(0, 10),
  set: (value) => {
    progressionDateMs.value = DateTime.fromISO(value).toMillis()
    session.setProgressionDate(progressionDateMs.value)
  },
})

const solarReturnYear = ref(new Date().getFullYear())

const profectionDateMs    = ref(Date.now())
const profectionDateInput = computed({
  get: () => new Date(profectionDateMs.value).toISOString().slice(0, 10),
  set: (value) => {
    profectionDateMs.value = DateTime.fromISO(value).toMillis()
  },
})

const solarArcDateMs    = ref(Date.now())
const solarArcDateInput = computed({
  get: () => new Date(solarArcDateMs.value).toISOString().slice(0, 10),
  set: (value) => {
    solarArcDateMs.value = DateTime.fromISO(value).toMillis()
  },
})

const lunarReturnDateMs    = ref(Date.now())
const lunarReturnDateInput = computed({
  get: () => new Date(lunarReturnDateMs.value).toISOString().slice(0, 10),
  set: (value) => {
    lunarReturnDateMs.value = DateTime.fromISO(value).toMillis()
  },
})

const transit = computed(() => person.value
  ? transitsFor(transitDateMs.value, person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
  : null
)
const transitAspects = computed(() =>
  natal.value && transit.value ? crossAspects(natal.value, transit.value, settings.aspectOptions) : []
)

const progressed = computed(() => {
  if (!person.value) return null
  const tzOffsetMinutes = offsetMinutesForPerson(person.value)
  const birthMs         = localToUtcMs(person.value.isoLocal, tzOffsetMinutes)
  const natalJdUt       = localToJdUt(person.value.isoLocal, tzOffsetMinutes)
  return secondaryProgression(natalJdUt, progressionDateMs.value, birthMs, person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
})
const progressionAspects = computed(() =>
  natal.value && progressed.value ? crossAspects(natal.value, progressed.value, settings.aspectOptions) : []
)

const solarReturn = computed(() => {
  if (!person.value || !natal.value) return null
  const near = new Date(`${solarReturnYear.value}-01-15T12:00Z`).getTime()
  return solarReturnChartForNatal(natal.value.jdUt, near, person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
})
const solarReturnAspects = computed(() =>
  natal.value && solarReturn.value ? crossAspects(natal.value, solarReturn.value, settings.aspectOptions) : []
)
const solarReturnNaturalAspects = computed(() =>
  solarReturn.value ? naturalAspects(solarReturn.value, settings.aspectOptions) : []
)

const profection = computed(() => {
  if (!person.value || !natal.value) return null
  return annualProfection(natal.value.ascendant, person.value.isoLocal, profectionDateInput.value)
})
const signs               = computed(() => tm('zodiac.signs'))
const profectionSignLabel = computed(() => profection.value ? signs.value[profection.value.sign] : '')
const profectionLordLabel = computed(() => profection.value ? t(`planets.${profection.value.lord}`) : '')

const directed = computed(() => {
  if (!person.value || !natal.value) return null
  const tzOffsetMinutes = offsetMinutesForPerson(person.value)
  const birthMs         = localToUtcMs(person.value.isoLocal, tzOffsetMinutes)
  const natalJdUt       = localToJdUt(person.value.isoLocal, tzOffsetMinutes)
  return solarArcDirections(natal.value, natalJdUt, solarArcDateMs.value, birthMs, person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
})
const solarArcAspects = computed(() =>
  natal.value && directed.value ? crossAspects(natal.value, directed.value, settings.aspectOptions) : []
)
const solarArcLabel = computed(() => directed.value ? directed.value.solarArc.toFixed(2) : '')

const lunarReturn = computed(() => {
  if (!person.value || !natal.value) return null
  return lunarReturnChartForNatal(natal.value.jdUt, lunarReturnDateMs.value, person.value.lat, person.value.lon, {
    zodiac:      settings.zodiac,
    houseSystem: settings.houseSystem,
    nodeMode:    settings.nodeMode,
  })
})
const lunarReturnAspects = computed(() =>
  natal.value && lunarReturn.value ? crossAspects(natal.value, lunarReturn.value, settings.aspectOptions) : []
)
const lunarReturnNaturalAspects = computed(() =>
  lunarReturn.value ? naturalAspects(lunarReturn.value, settings.aspectOptions) : []
)

const formatUtcReturnDate = (chart) => {
  if (!chart) return ''
  const date = new Date((chart.jdUt - 2440587.5) * 86_400_000)
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone:  'UTC',
  }).format(date)
}

const solarReturnDate = computed(() => formatUtcReturnDate(solarReturn.value))
const lunarReturnDate = computed(() => formatUtcReturnDate(lunarReturn.value))
</script>

<template lang="pug">
section.timing-page(data-testid='timing-page')
  .flex.flex-wrap.items-center.justify-between.gap-3.mb-5
    div
      h1.text-xl.font-semibold.text-slate-100 {{ t('techniques.workspace.title') }}
      p.text-sm.text-slate-400(v-if='person') {{ person.name }}
    .inline-flex.flex-wrap.gap-1.rounded-lg.border.p-1(class='border-white/10 bg-white/5' role='tablist' aria-label='Timing techniques')
      button.rounded-md.px-3.text-xs.font-medium.transition(
        v-for='option in techniqueOptions'
        :key='option.id'
        type='button'
        role='tab'
        :aria-selected='activeTechnique === option.id'
        :data-testid='option.testid'
        :class='activeTechnique === option.id ? "py-1.5 bg-amber-300 text-slate-950" : "py-1.5 text-slate-300 hover:bg-white/10 hover:text-slate-100"'
        @click='selectTechnique(option.id)'
      ) {{ option.label() }}

  div(v-if='!person')
    p.text-slate-400 {{ t('chart.select_chart') }}

  template(v-else)
    section.transits-page(v-if='activeTechnique === "transits"' data-testid='transits-page')
      .transit-toolbar
        .transit-toolbar__title
          h2 {{ t('nav.transits') }}
          p {{ t('chart.natal_positions') }} × {{ t('chart.transit_positions') }}
        .transit-toolbar__controls
          label.transit-date-control
            span {{ t('chart.transit_date') }}
            input.ui-control.ui-control-sm(
              type='datetime-local'
              v-model='transitDateInput'
              data-testid='transit-date'
            )
          button.transit-now-button(
            type='button'
            @click='transitDateInput = new Date().toISOString().slice(0,16)'
            data-testid='btn-now'
          ) {{ t('common.now') }}
          .transit-count-pill(v-if='transitAspects.length')
            span {{ t('chart.summary') }}
            strong {{ transitAspects.length }}
      .transit-main-grid
        .transit-chart-panel
          Biwheel(
            v-if='natal && transit'
            :natal='natal'
            :overlay='transit'
            :aspect-options='settings.aspectOptions'
            :planet-glyph-renderer='settings.planetGlyphRenderer'
          )
        .transit-side-panel
          ComparisonInsightPanel(:aspects='transitAspects' :base='natal' :comparison='transit' mode='transit')
          .transit-aspects-panel(v-if='transitAspects.length')
            AspectTable(:aspects='transitAspects')
      .transit-matrix-panel(v-if='natal && transit')
        AspectMatrix(
          :base='natal'
          :comparison='transit'
          :aspect-options='settings.aspectOptions'
          :base-label='t("chart.natal_positions")'
          :comparison-label='t("chart.transit_positions")'
          :planet-glyph-renderer='settings.planetGlyphRenderer'
        )

    section.progressions-page(v-else-if='activeTechnique === "progressions"' data-testid='progressions-page')
      .flex.items-center.gap-3.mb-4
        label.text-xs.text-slate-400 {{ t('chart.progression_date') }}
        input.ui-control.ui-control-sm(
          type='date'
          v-model='progressionDateInput'
          data-testid='prog-date'
        )
        button.text-xs.text-amber-300(
          class='hover:text-amber-200'
          type='button'
          @click='progressionDateInput = new Date().toISOString().slice(0,10)'
          data-testid='btn-today'
        ) {{ t('common.today') }}
      ComparisonInsightPanel.mb-6(:aspects='progressionAspects' :base='natal' :comparison='progressed' mode='progression')
      Comparison(
        v-if='natal && progressed'
        :base='natal'
        :comparison='progressed'
        :aspects='progressionAspects'
        :base-label='t("chart.natal_positions")'
        :comparison-label='t("chart.current_positions")'
        :aspect-options='settings.aspectOptions'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )

    section.solar-return(v-else-if='activeTechnique === "solar-return"' data-testid='solar-return-page')
      .flex.flex-wrap.items-center.gap-3.mb-4
        label.text-xs.text-slate-400 {{ t('chart.solar_return_year') }}
        input.ui-control.ui-control-sm.w-24(
          type='number'
          v-model.number='solarReturnYear'
          data-testid='sr-year'
        )
        .text-xs.text-slate-400(v-if='solarReturnDate' data-testid='sr-date') {{ t('chart.solar_return_exact') }}: {{ solarReturnDate }} UTC
      Insight.mb-6(:chart='solarReturn' :aspects='solarReturnNaturalAspects' v-if='solarReturn')
      Comparison(
        v-if='natal && solarReturn'
        :base='natal'
        :comparison='solarReturn'
        :aspects='solarReturnAspects'
        :base-label='t("chart.natal_positions")'
        :comparison-label='t("chart.solar_return_positions")'
        :aspect-options='settings.aspectOptions'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )

    section.profections-page(v-else-if='activeTechnique === "profections"' data-testid='profections-page')
      .flex.flex-wrap.items-center.gap-3.mb-4
        label.text-xs.text-slate-400 {{ t('techniques.profections.date') }}
        input.ui-control.ui-control-sm(
          type='date'
          v-model='profectionDateInput'
          data-testid='profection-date'
        )
        button.text-xs.text-amber-300(
          class='hover:text-amber-200'
          type='button'
          @click='profectionDateInput = new Date().toISOString().slice(0,10)'
          data-testid='btn-today'
        ) {{ t('common.today') }}

      .ui-panel(v-if='profection' data-testid='profection-summary')
        h1.text-xl.font-semibold.text-slate-100.mb-1 {{ t('techniques.profections.title') }}
        p.text-sm.text-slate-400.mb-5 {{ t('techniques.profections.subtitle', { name: person.name }) }}
        .grid.gap-3(class='sm:grid-cols-2 lg:grid-cols-4')
          .rounded.border.p-3(class='border-white/10 bg-white/5')
            .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.age') }}
            .mt-1.text-2xl.font-semibold.text-slate-100(data-testid='profection-age') {{ profection.age }}
          .rounded.border.p-3(class='border-white/10 bg-white/5')
            .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.house') }}
            .mt-1.text-2xl.font-semibold.text-slate-100(data-testid='profection-house') {{ profection.profectedHouse }}
          .rounded.border.p-3(class='border-white/10 bg-white/5')
            .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.sign') }}
            .mt-1.text-lg.font-semibold.text-slate-100(data-testid='profection-sign') {{ profectionSignLabel }}
          .rounded.border.p-3(class='border-white/10 bg-white/5')
            .text-xs.uppercase.tracking-wide.text-slate-500 {{ t('techniques.profections.lord') }}
            .mt-1.text-lg.font-semibold.text-slate-100(data-testid='profection-lord') {{ profectionLordLabel }}
        p.mt-4.text-xs.text-slate-400(data-testid='profection-cycle')
          | {{ t('techniques.profections.cycle', { cycle: profection.cycle }) }}

    section.solar-arc-page(v-else-if='activeTechnique === "solar-arc"' data-testid='solar-arc-page')
      .flex.flex-wrap.items-center.gap-3.mb-4
        label.text-xs.text-slate-400 {{ t('techniques.solar_arc.date') }}
        input.ui-control.ui-control-sm(
          type='date'
          v-model='solarArcDateInput'
          data-testid='solar-arc-date'
        )
        button.text-xs.text-amber-300(
          class='hover:text-amber-200'
          type='button'
          @click='solarArcDateInput = new Date().toISOString().slice(0,10)'
          data-testid='btn-today'
        ) {{ t('common.today') }}
        .text-xs.text-slate-400(v-if='directed' data-testid='solar-arc-degrees')
          | {{ t('techniques.solar_arc.arc') }}: {{ solarArcLabel }}°
      Comparison(
        v-if='natal && directed'
        :base='natal'
        :comparison='directed'
        :aspects='solarArcAspects'
        :base-label='t("chart.natal_positions")'
        :comparison-label='t("techniques.solar_arc.positions")'
        :aspect-options='settings.aspectOptions'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )

    section.lunar-return-page(v-else-if='activeTechnique === "lunar-return"' data-testid='lunar-return-page')
      .flex.flex-wrap.items-center.gap-3.mb-4
        label.text-xs.text-slate-400 {{ t('techniques.lunar_return.date') }}
        input.ui-control.ui-control-sm(
          type='date'
          v-model='lunarReturnDateInput'
          data-testid='lunar-return-date'
        )
        button.text-xs.text-amber-300(
          class='hover:text-amber-200'
          type='button'
          @click='lunarReturnDateInput = new Date().toISOString().slice(0,10)'
          data-testid='btn-today'
        ) {{ t('common.today') }}
        .text-xs.text-slate-400(v-if='lunarReturnDate' data-testid='lunar-return-exact')
          | {{ t('techniques.lunar_return.exact') }}: {{ lunarReturnDate }} UTC
      Insight.mb-6(:chart='lunarReturn' :aspects='lunarReturnNaturalAspects' v-if='lunarReturn')
      Comparison(
        v-if='natal && lunarReturn'
        :base='natal'
        :comparison='lunarReturn'
        :aspects='lunarReturnAspects'
        :base-label='t("chart.natal_positions")'
        :comparison-label='t("techniques.lunar_return.positions")'
        :aspect-options='settings.aspectOptions'
        :planet-glyph-renderer='settings.planetGlyphRenderer'
      )
</template>

<style scoped>
.transit-toolbar {
  align-items: center;
  background: color-mix(in srgb, var(--app-panel-strong) 84%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  box-shadow: var(--app-shadow);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
}

.transit-toolbar__title h2 {
  color: var(--app-heading);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
}

.transit-toolbar__title p {
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.25;
  margin: 0.2rem 0 0;
}

.transit-toolbar__controls {
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.transit-date-control {
  color: var(--app-text-muted);
  display: grid;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.25rem;
}

.transit-date-control input {
  min-width: 12.5rem;
}

.transit-now-button,
.transit-count-pill {
  align-items: center;
  border-radius: 0.25rem;
  display: inline-flex;
  min-height: 2rem;
}

.transit-now-button {
  background: rgb(252 211 77);
  color: rgb(15 23 42);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.4rem 0.72rem;
}

.transit-now-button:hover,
.transit-now-button:focus-visible {
  background: rgb(253 230 138);
}

.transit-count-pill {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  color: var(--app-text-soft);
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
}

.transit-count-pill span {
  color: var(--app-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.transit-count-pill strong {
  color: var(--app-heading);
  font-size: 0.9rem;
  line-height: 1;
}

.transit-main-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.transit-chart-panel,
.transit-side-panel,
.transit-matrix-panel,
.transit-aspects-panel {
  background: color-mix(in srgb, var(--app-panel) 88%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  box-shadow: var(--app-shadow);
}

.transit-chart-panel {
  min-width: 0;
  padding: 0.9rem;
}

.transit-side-panel {
  align-content: start;
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 0.9rem;
}

.transit-side-panel :deep(.comparison-insight-panel) {
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 0;
}

.transit-aspects-panel {
  box-shadow: none;
  padding: 0.9rem;
}

.transit-matrix-panel {
  margin-top: 1rem;
  overflow: hidden;
  padding: 0.9rem;
}

@media (min-width: 1180px) {
  .transit-main-grid {
    align-items: start;
    grid-template-columns: minmax(34rem, 1.35fr) minmax(21rem, 0.65fr);
  }
}

@media (max-width: 640px) {
  .transit-toolbar {
    align-items: stretch;
  }

  .transit-toolbar__controls,
  .transit-date-control,
  .transit-date-control input,
  .transit-now-button {
    width: 100%;
  }

  .transit-now-button {
    justify-content: center;
  }
}
</style>
