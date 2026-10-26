<script setup>
import { computed } from 'vue'
import { useHdText } from '../useHdText.js'
import PanelBlock from './PanelBlock.vue'
import PanelHead from './PanelHead.vue'

const props = defineProps({
  chart: { type: Object, required: true },
  value: { type: String, required: true },
})

const { t, prose } = useHdText()

const arrow    = computed(() => props.chart.variableDetails.arrows[props.value])
const variable = computed(() => props.chart.variables.find(item => item.id === props.value))
const color    = computed(() => t(`human_design.variable_colors.${props.value}.${arrow.value.color}`))
</script>

<template lang="pug">
.hd-detail(data-testid='hd-detail-variable')
  PanelHead(:kicker='t("human_design.variables")' :title='t(`human_design.variable_labels.${value}.label`)')
    span.hd-chip(:data-tone='arrow.layer') {{ t(`human_design.${arrow.layer}`) }}
    span.hd-chip(data-tone='muted') {{ t(`human_design.orientations.${arrow.orientation}`) }}
    span.hd-chip.hd-num(data-tone='muted') {{ variable.code }}
  p.hd-lead {{ prose('variables', 'areas', value, 'summary') }}
  PanelBlock(:title='t(`human_design.orientations.${arrow.orientation}`)')
    p.hd-body {{ prose('variables', 'arrows', arrow.orientation, value, 'summary') }}
  PanelBlock(:title='color')
    p.hd-body {{ prose('variables', 'colors', value, arrow.color, 'summary') }}
  p.hd-body {{ prose('variables', 'shorthand', 'note') }}
</template>
