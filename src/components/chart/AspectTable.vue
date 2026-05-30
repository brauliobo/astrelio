<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  aspects:              { type: Array, required: true },
  highlightedBodies:    { type: Array, default: () => [] },
  highlightedAspectKey: { type: String, default: '' },
})
const emit = defineEmits(['highlight', 'clear-highlight', 'toggle-highlight'])
const { t } = useI18n()
const filter                = ref('all')
const hoverHighlight        = ref(null)
const pinnedHighlight       = ref(null)
const sharedHoverHighlight  = ref(null)
const sharedPinnedHighlight = ref(null)
const chartHighlightEvent   = 'astrelio-chart-highlight'

const aspectKey = (aspect) => `${aspect.a}-${aspect.b}-${aspect.type}`

const colorOf = (type) => ({
  conjunction: 'text-slate-200',
  opposition:  'text-rose-300',
  trine:       'text-sky-300',
  square:      'text-rose-400',
  sextile:     'text-emerald-300',
  quincunx:    'text-amber-300'
}[type] || 'text-slate-300')

const options = computed(() => [
  { id: 'all', label: t('common.all'), count: props.aspects.length },
  { id: 'tight', label: t('aspects.tight'), count: props.aspects.filter(a => a.delta <= 1).length },
  { id: 'applying', label: t('aspects.applying'), count: props.aspects.filter(a => a.applying).length },
])

const filtered = computed(() => {
  if (filter.value === 'tight') return props.aspects.filter(a => a.delta <= 1)
  if (filter.value === 'applying') return props.aspects.filter(a => a.applying)
  return props.aspects
})

const rows = computed(() => filtered.value.map(a => ({
  ...a,
  aspectKey:   aspectKey(a),
  label:       t(`aspects.${a.type}`),
  pa:          t(`planets.${a.a}`),
  pb:          t(`planets.${a.b}`),
  delta:       a.delta.toFixed(2),
  state:       a.applying ? t('aspects.applying') : t('aspects.separating'),
  strengthPct: `${Math.round((a.strength || 0) * 100)}%`
})))

const hasExternalHighlight = computed(() =>
  props.highlightedBodies.length > 0 || Boolean(props.highlightedAspectKey)
)
const localHighlight = computed(() =>
  hoverHighlight.value || pinnedHighlight.value || sharedHoverHighlight.value || sharedPinnedHighlight.value
)
const activeBodies = computed(() =>
  new Set(hasExternalHighlight.value ? props.highlightedBodies : localHighlight.value?.bodies || [])
)
const activeAspectKey = computed(() =>
  hasExternalHighlight.value ? props.highlightedAspectKey : localHighlight.value?.aspectKey || ''
)
const hasHighlight = computed(() => activeBodies.value.size > 0 || Boolean(activeAspectKey.value))

const highlightPayload = (row) => ({
  bodies:    [row.a, row.b],
  aspectKey: row.aspectKey,
})

const normalizeHighlight = (payload) => ({
  bodies:    [...new Set(payload?.bodies || [])],
  aspectKey: payload?.aspectKey || '',
})

const sameHighlight = (a, b) =>
  a.aspectKey === b.aspectKey &&
  a.bodies.length === b.bodies.length &&
  a.bodies.every(body => b.bodies.includes(body))

const broadcastHighlight = (highlight, pinned = false) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(chartHighlightEvent, { detail: { highlight, pinned } }))
}

const onSharedHighlight = (event) => {
  const highlight = event.detail?.highlight ? normalizeHighlight(event.detail.highlight) : null
  if (event.detail?.pinned) {
    sharedPinnedHighlight.value = highlight
    sharedHoverHighlight.value  = null
  } else {
    sharedHoverHighlight.value = highlight
  }
}

const setHoverHighlight = (row) => {
  const highlight      = highlightPayload(row)
  hoverHighlight.value = highlight
  emit('highlight', highlight)
  broadcastHighlight(highlight)
}

const clearHoverHighlight = () => {
  hoverHighlight.value = null
  emit('clear-highlight')
  broadcastHighlight(null)
}

const togglePinnedHighlight = (row) => {
  const highlight       = highlightPayload(row)
  pinnedHighlight.value = pinnedHighlight.value && sameHighlight(pinnedHighlight.value, highlight) ? null : highlight
  hoverHighlight.value  = null
  emit('toggle-highlight', highlight)
  broadcastHighlight(pinnedHighlight.value, true)
}

const rowTouchesActiveBody = (row) => activeBodies.value.has(row.a) || activeBodies.value.has(row.b)
const rowHighlightState    = (row) => {
  if (!hasHighlight.value) return 'idle'
  if (activeAspectKey.value) return activeAspectKey.value === row.aspectKey ? 'active' : 'dimmed'
  return rowTouchesActiveBody(row) ? 'active' : 'dimmed'
}

const rowClass = (row) => {
  const state = rowHighlightState(row)
  if (state === 'active') return 'bg-amber-300/10 ring-1 ring-inset ring-amber-300/35'
  if (state === 'dimmed') return 'opacity-45'
  return 'hover:bg-white/5 focus:bg-white/5'
}

onMounted(() => {
  window.addEventListener(chartHighlightEvent, onSharedHighlight)
})

onBeforeUnmount(() => {
  window.removeEventListener(chartHighlightEvent, onSharedHighlight)
})
</script>

<template lang="pug">
.aspects(data-testid='aspect-table')
  .flex.flex-wrap.items-center.justify-between.gap-3.mb-3
    .text-sm.text-slate-400 {{ t('chart.summary') }}
    .flex.flex-wrap.gap-1
      button.rounded.px-2.py-1.text-xs(
        v-for='option in options'
        :key='option.id'
        type='button'
        :class='filter === option.id ? "bg-amber-300 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"'
        @click='filter = option.id'
        :data-testid='`aspect-filter-${option.id}`'
      ) {{ option.label }} · {{ option.count }}
  .overflow-x-auto
    table.w-full.text-sm
      thead.text-xs.text-slate-500
        tr
          th.py-1.pr-2.text-left.font-medium {{ t('aspects.body_a') }}
          th.py-1.px-2.text-center.font-medium {{ t('aspects.aspect') }}
          th.py-1.px-2.text-left.font-medium {{ t('aspects.body_b') }}
          th.py-1.px-2.text-left.font-medium {{ t('aspects.motion') }}
          th.py-1.pl-2.text-right.font-medium {{ t('aspects.orb') }}
      tbody
        tr.border-t.cursor-pointer.outline-none(
          class='border-white/5'
          v-for='r in rows'
          :key='r.aspectKey'
          :class='[colorOf(r.type), rowClass(r)]'
          :data-aspect-row='r.aspectKey'
          :data-highlight='rowHighlightState(r)'
          :aria-pressed='activeAspectKey === r.aspectKey'
          role='button'
          tabindex='0'
          @mouseenter='setHoverHighlight(r)'
          @mouseleave='clearHoverHighlight'
          @focus='setHoverHighlight(r)'
          @blur='clearHoverHighlight'
          @click='togglePinnedHighlight(r)'
          @keydown.enter.prevent='togglePinnedHighlight(r)'
          @keydown.space.prevent='togglePinnedHighlight(r)'
        )
          td.py-1.pr-2.whitespace-nowrap {{ r.pa }}
          td.py-1.px-2.text-center.whitespace-nowrap {{ r.label }}
          td.py-1.px-2.whitespace-nowrap {{ r.pb }}
          td.py-1.px-2.text-slate-400.whitespace-nowrap
            .flex.items-center.gap-2
              .rounded-full(class='h-1.5 w-14 bg-white/10')
                .rounded-full.bg-current(class='h-1.5' :style='{ width: r.strengthPct }')
              span {{ r.state }}
          td.py-1.pl-2.text-right.text-slate-400.tabular-nums.whitespace-nowrap {{ r.delta }}°
  p.text-xs.text-slate-500(v-if='!rows.length') {{ t('aspects.none_for_filter') }}
</template>
