<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignContentKey } from '../../../lib/human-design/labels.js'
import CenterCard from './CenterCard.vue'
import StateBadge from './StateBadge.vue'
import { centersByClass } from './model.js'

const props = defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
})

defineEmits(['select'])

const { t }    = useI18n()
const root     = ref(null)
const expanded = ref([])
const groups   = computed(() => centersByClass(props.chart))
const states   = ['defined', 'undefined', 'open']
const pinnedId = computed(() => (props.pinned?.type === 'center' ? props.pinned.value : null))

const toggle = id => { expanded.value = expanded.value.includes(id) ? expanded.value.filter(item => item !== id) : [...expanded.value, id] }

const reveal = async (id) => {
  if (!id) return
  expanded.value = [...new Set([...expanded.value, id])]
  await nextTick()
  root.value?.querySelector(`[data-center="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

watch(pinnedId, reveal, { immediate: true })
</script>

<template lang="pug">
.hda-panel(ref='root' data-testid='analysis-centers')
  p.hda-intro {{ t('human_design.ui.analysis.centers_intro') }}
  .hda-row(role='list' :aria-label='t("human_design.ui.analysis.legend")')
    span.hda-chip(v-for='state in states' :key='state' role='listitem')
      StateBadge(:state='state' :label='t(humanDesignContentKey("center_states", state, "label"))')
  p.hda-sub {{ t('human_design.ui.analysis.carriers_note') }}

  section.hda-section(v-for='group in groups' :key='group.id' :data-class='group.id')
    div
      h3.hda-title {{ t(`human_design.ui.analysis.center_classes.${group.id}.name`) }}
      p.hda-sub {{ t(`human_design.ui.analysis.center_classes.${group.id}.summary`) }}
    .hda-grid
      CenterCard(
        v-for='card in group.centers'
        :key='card.id'
        :card='card'
        :pinned='pinnedId === card.id'
        :expanded='expanded.includes(card.id)'
        @toggle='toggle(card.id)'
        @select='$emit("select", $event)'
      )
</template>
