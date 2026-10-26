<script setup>
import { useI18n } from 'vue-i18n'
import { humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import { centerHighlight } from '../../../lib/human-design/relations.js'

defineProps({
  dynamics: { type: Array, required: true },
  names:    { type: Object, required: true },
})

const emit  = defineEmits(['highlight'])
const { t } = useI18n()

const sides     = ({ definedByA, definedByB }) => [{ side: 'a', on: definedByA }, { side: 'b', on: definedByB }]
const statusKey = ({ status, definedInComposite }) => status === 'open' && definedInComposite ? 'together' : status
const show      = center => emit('highlight', centerHighlight(center))
</script>

<template lang="pug">
ul.grid.grid-cols-2.gap-2(class='sm:grid-cols-3 lg:grid-cols-5' data-testid='hd-center-classification')
  li(v-for='item in dynamics' :key='item.center')
    button.hd-center-chip.w-full.rounded.border.px-3.py-2.text-left(
      type='button'
      class='border-white/10 bg-white/5'
      :data-status='item.status'
      @pointerenter='show(item.center)'
      @pointerleave='emit("highlight", null)'
      @focus='show(item.center)'
      @blur='emit("highlight", null)'
    )
      .flex.items-center.justify-between.gap-2
        span.text-xs.font-semibold.text-slate-100 {{ humanDesignValueLabel(t, 'center', item.center) }}
        span.flex.gap-1(aria-hidden='true')
          i.hd-center-chip__dot(v-for='dot in sides(item)' :key='dot.side' :class='[`hd-center-chip__dot--${dot.side}`, { "is-on": dot.on }]')
      .mt-1.text-xs.text-slate-400 {{ t(`human_design.ui.relations.centers.${statusKey(item)}`, { a: names.a, b: names.b }) }}
</template>

<style scoped>
.hd-center-chip__dot {
  --dot: var(--hd-personality);
  border: 1.5px solid var(--dot);
  border-radius: 9999px;
  height: 0.6rem;
  width: 0.6rem;
}

.hd-center-chip__dot--b { --dot: var(--hd-design); }
.hd-center-chip__dot.is-on { background: var(--dot); }
</style>
