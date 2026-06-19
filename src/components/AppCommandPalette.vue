<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePeopleStore } from '../stores/people.js'
import { useSessionStore } from '../stores/session.js'
import { REPORT_PRESET_KEYS, SETTING_PRESET_KEYS, useSettingsStore } from '../stores/settings.js'
import { natalRouteForPerson } from '../lib/people/routeQuery.js'
import { broadcastChartHighlight } from '../lib/chart/highlight.js'

const props = defineProps({
  chart: { type: Object, default: null },
})

const { t, tm } = useI18n()
const router    = useRouter()
const people    = usePeopleStore()
const session   = useSessionStore()
const settings  = useSettingsStore()
const open      = ref(false)
const query     = ref('')
const activeIndex = ref(0)

const close = () => {
  open.value  = false
  query.value = ''
}

const openPalette = () => {
  open.value = true
  nextTick(() => document.querySelector('[data-testid="command-palette-input"]')?.focus())
}

const navigate = (to) => {
  router.push(to)
  close()
}

const normalizeSearch = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

const groupLabel = group => t(`command_palette.groups.${group}`)

const command = ({ id, label, group, keywords = [], priority = 0, run }) => ({
  id,
  label,
  group,
  groupLabel: groupLabel(group),
  meta:       groupLabel(group),
  keywords,
  priority,
  run,
})

const timingCommand = ({ id, labelKey, routeName, apply, keywords = [] }) => command({
  id,
  label:    t(`command_palette.${labelKey}`),
  group:    'techniques',
  keywords: [routeName.replace('-', ' '), 'timing', ...keywords],
  priority: 20,
  run:      () => {
    apply()
    navigate({ name: routeName })
  },
})

const scoreCommand = (item, needle) => {
  if (!needle) return item.priority

  const label    = normalizeSearch(item.label)
  const meta     = normalizeSearch(item.meta)
  const keywords = (item.keywords || []).map(normalizeSearch).filter(Boolean)
  const fields   = [label, meta, ...keywords]
  const joined   = fields.join(' ')
  const terms    = needle.split(/\s+/).filter(Boolean)

  if (label === needle) return 1000 + item.priority
  if (label.startsWith(needle)) return 900 + item.priority
  if (label.split(/\s+/).some(word => word.startsWith(needle))) return 800 + item.priority
  if (keywords.some(keyword => keyword === needle)) return 700 + item.priority
  if (keywords.some(keyword => keyword.startsWith(needle))) return 650 + item.priority
  if (meta.includes(needle)) return 500 + item.priority
  if (fields.some(field => field.includes(needle))) return 400 + item.priority
  if (terms.length > 1 && terms.every(term => joined.includes(term))) return 300 + item.priority
  return 0
}

const pinPlanet = (name) => {
  broadcastChartHighlight({
    chart:     props.chart,
    pinned:    true,
    highlight: { bodies: [name], aspectKey: '' },
  })
  close()
}

const planetCommands = computed(() =>
  (props.chart?.positions || []).map(position => command({
    id:       `planet-${position.name}`,
    label:    t(`planets.${position.name}`),
    group:    'planets',
    keywords: [position.name, t(`planets.${position.name}`), 'inspect', 'pin'],
    run:      () => pinPlanet(position.name),
  }))
)

const houseCommands = computed(() => {
  const names = tm('houses.names')
  return Array.from({ length: 12 }, (_, index) => command({
    id:       `house-${index + 1}`,
    label:    names?.[index] ? t('houses.numbered_name', { house: index + 1, name: names[index] }) : `House ${index + 1}`,
    group:    'houses',
    keywords: [`house ${index + 1}`, names?.[index] || ''],
    run:      () => navigate({ name: 'natal' }),
  }))
})

const settingPresetCommands = computed(() => SETTING_PRESET_KEYS.map(preset => command({
  id:       `setting-preset-${preset}`,
  label:    `${t('settings.preset')}: ${t(`settings.presets.${preset}`)}`,
  group:    'settings',
  keywords: ['preset', 'chart preset', 'settings preset', preset, t(`settings.presets.${preset}`)],
  priority: 12,
  run:      () => {
    settings.applyPreset(preset)
    close()
  },
})))

const reportPresetCommands = computed(() => REPORT_PRESET_KEYS.map(preset => command({
  id:       `report-preset-${preset}`,
  label:    `${t('report.preset')}: ${t(`report.presets.${preset}`)}`,
  group:    'settings',
  keywords: ['preset', 'report preset', 'report', preset, t(`report.presets.${preset}`)],
  priority: 12,
  run:      () => {
    settings.applyReportPreset(preset)
    navigate({ name: 'report' })
  },
})))

const commands = computed(() => [
  command({ id: 'home', label: t('nav.home'), group: 'navigation', keywords: ['home', 'people', 'library'], run: () => navigate({ name: 'home' }) }),
  command({ id: 'map', label: t('nav.map'), group: 'navigation', keywords: ['map', 'natal', 'chart'], run: () => navigate({ name: 'natal' }) }),
  command({ id: 'vedic', label: t('modalities.vedic'), group: 'modalities', keywords: ['vedic', 'sidereal'], priority: 10, run: () => navigate({ name: 'vedic' }) }),
  command({ id: 'human-design', label: t('modalities.human_design'), group: 'modalities', keywords: ['human design', 'bodygraph'], priority: 10, run: () => navigate({ name: 'human-design' }) }),
  command({ id: 'report', label: t('report.open'), group: 'navigation', keywords: ['report', 'export', 'print'], run: () => navigate({ name: 'report' }) }),
  command({ id: 'timing', label: t('nav.timing'), group: 'navigation', keywords: ['timing', 'transits'], run: () => navigate({ name: 'transits' }) }),
  command({ id: 'synastry', label: t('nav.relations'), group: 'navigation', keywords: ['relationship', 'synastry'], run: () => navigate({ name: 'synastry' }) }),
  command({ id: 'settings', label: t('nav.settings'), group: 'settings', keywords: ['settings', 'preset', 'system'], run: () => navigate({ name: 'settings' }) }),
  timingCommand({ id: 'timing-transits-now', labelKey: 'timing_now', routeName: 'transits', apply: () => session.setTransitDate(Date.now()), keywords: ['now', 'current'] }),
  timingCommand({ id: 'timing-progressions-today', labelKey: 'progressions_today', routeName: 'progressions', apply: () => session.setProgressionDate(Date.now()), keywords: ['today'] }),
  timingCommand({ id: 'timing-solar-return-this-year', labelKey: 'solar_return_this_year', routeName: 'solar-return', apply: () => session.setSolarReturnYear(new Date().getFullYear()), keywords: ['return', 'year'] }),
  timingCommand({ id: 'timing-profections-today', labelKey: 'profections_today', routeName: 'profections', apply: () => session.setProfectionDate(Date.now()), keywords: ['today'] }),
  timingCommand({ id: 'timing-solar-arc-today', labelKey: 'solar_arc_today', routeName: 'solar-arc', apply: () => session.setSolarArcDate(Date.now()), keywords: ['today'] }),
  timingCommand({ id: 'timing-lunar-return-today', labelKey: 'lunar_return_today', routeName: 'lunar-return', apply: () => session.setLunarReturnDate(Date.now()), keywords: ['today'] }),
  ...['transits', 'progressions', 'solar-return', 'profections', 'solar-arc', 'lunar-return'].map(name => command({
    id:       `technique-${name}`,
    label:    t(name === 'solar-return' ? 'nav.solar_return' : name === 'profections' ? 'techniques.nav.profections' : name === 'solar-arc' ? 'techniques.nav.solar_arc' : name === 'lunar-return' ? 'techniques.nav.lunar_return' : `nav.${name}`),
    group:    'techniques',
    keywords: [name.replace('-', ' ')],
    run:      () => navigate({ name }),
  })),
  ...people.sorted.map(person => command({
    id:       `person-${person.id}`,
    label:    t('command_palette.switch_chart', { name: person.name }),
    group:    'people',
    keywords: [person.name, person.placeLabel, person.isoLocal, 'active chart', 'switch chart'],
    priority: 15,
    run:      () => {
      session.setActive(person.id)
      navigate(natalRouteForPerson(person))
    },
  })),
  ...settingPresetCommands.value,
  ...reportPresetCommands.value,
  ...planetCommands.value,
  ...houseCommands.value,
])

const filteredCommands = computed(() => {
  const needle = normalizeSearch(query.value)
  if (!needle) return commands.value.slice(0, 12)
  return commands.value
    .map((item, index) => ({ item, index, score: scoreCommand(item, needle) }))
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score || right.item.priority - left.item.priority || left.index - right.index)
    .map(result => result.item)
    .slice(0, 16)
})

watch([query, filteredCommands], () => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(filteredCommands.value.length - 1, 0))
})

const runActive = () => {
  filteredCommands.value[activeIndex.value]?.run()
}

const onPaletteKeydown = (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filteredCommands.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Home') {
    event.preventDefault()
    activeIndex.value = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    activeIndex.value = Math.max(filteredCommands.value.length - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    runActive()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

const onKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openPalette()
    return
  }
  if (event.key === 'Escape') close()
}

defineExpose({ openPalette })

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template lang="pug">
button.command-palette-trigger(
  type='button'
  data-testid='command-palette-trigger'
  @click='openPalette'
) {{ t('command_palette.open') }}

Teleport(to='body')
  .command-palette-backdrop(v-if='open' data-testid='command-palette-backdrop' @click='close')
  .command-palette(v-if='open' data-testid='command-palette')
    .command-palette__field
      input(
        v-model='query'
        type='search'
        :placeholder='t("command_palette.placeholder")'
        data-testid='command-palette-input'
        role='combobox'
        aria-controls='command-palette-list'
        :aria-activedescendant='filteredCommands[activeIndex]?.id ? `command-option-${filteredCommands[activeIndex].id}` : undefined'
        @keydown='onPaletteKeydown'
        autofocus
      )
      span Ctrl K
    .command-palette__results(v-if='filteredCommands.length' id='command-palette-list' role='listbox')
      template(v-for='(command, index) in filteredCommands' :key='command.id')
        p.command-palette__group(
          v-if='command.groupLabel !== filteredCommands[index - 1]?.groupLabel'
          role='presentation'
          :data-testid='`command-group-${command.group}`'
        ) {{ command.groupLabel }}
        button.command-palette__item(
          :id='`command-option-${command.id}`'
          type='button'
          role='option'
          :aria-selected='index === activeIndex'
          :class='{ active: index === activeIndex }'
          @mouseenter='activeIndex = index'
          @click='command.run()'
          :data-testid='`command-${command.id}`'
        )
          span {{ command.label }}
          small {{ command.meta }}
    p.command-palette__empty(v-else data-testid='command-palette-empty') {{ query.trim() ? t('command_palette.empty_query', { query: query.trim() }) : t('command_palette.empty') }}
</template>

<style scoped>
.command-palette-trigger {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-soft);
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 800;
  height: 2rem;
  padding: 0 0.7rem;
}

.command-palette-trigger:hover {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.command-palette-backdrop {
  background: rgb(2 6 23 / 0.48);
  inset: 0;
  position: fixed;
  z-index: 45;
}

.command-palette {
  background: color-mix(in srgb, var(--app-panel-strong) 96%, var(--app-bg));
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.42);
  display: grid;
  gap: 0.75rem;
  left: 50%;
  max-width: min(42rem, calc(100vw - 2rem));
  padding: 0.8rem;
  position: fixed;
  top: 5.5rem;
  transform: translateX(-50%);
  width: 100%;
  z-index: 50;
}

.command-palette__field {
  align-items: center;
  background: var(--app-control);
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  display: flex;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
}

.command-palette__field input {
  background: transparent;
  color: var(--app-heading);
  flex: 1;
  font-size: 1rem;
  outline: none;
}

.command-palette__field span {
  color: var(--app-text-subtle);
  font-size: 0.68rem;
  font-weight: 800;
}

.command-palette__results {
  display: grid;
  gap: 0.3rem;
  max-height: min(28rem, 62vh);
  overflow: auto;
}

.command-palette__item {
  align-items: center;
  border-radius: 0.65rem;
  color: var(--app-text-soft);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.65rem 0.75rem;
  text-align: left;
}

.command-palette__group {
  color: var(--app-text-subtle);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0.35rem 0 0.1rem;
  padding: 0 0.75rem;
  text-transform: uppercase;
}

.command-palette__item:hover,
.command-palette__item:focus-visible,
.command-palette__item.active {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.command-palette__item small,
.command-palette__empty {
  color: var(--app-text-muted);
  font-size: 0.75rem;
}
</style>
