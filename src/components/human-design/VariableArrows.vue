<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  variables: { type: Array, default: () => [] },
})

const { t } = useI18n()
const variableLabel = variable => {
  const key = `human_design.variable_labels.${variable.id}.label`
  const translated = t(key)
  return translated === key ? variable.label : translated
}

const positionClass = {
  digestion: 'top-left',
  environment: 'bottom-left',
  motivation: 'top-right',
  perspective: 'bottom-right',
}
</script>

<template lang="pug">
g(data-testid='hd-variable-arrows')
  g(
    v-for='variable in variables'
    :key='variable.id'
    :class='["hd-variable-arrow", positionClass[variable.id], variable.orientation]'
    :data-variable='variable.id'
    :data-orientation='variable.orientation'
  )
    title {{ variableLabel(variable) }} · {{ t(`human_design.orientations.${variable.orientation}`) }}
    path(
      v-if='variable.orientation === "left"'
      d='M18 8 L4 18 L18 28'
      fill='none'
      stroke='currentColor'
      stroke-width='4'
      stroke-linecap='round'
      stroke-linejoin='round'
    )
    path(
      v-else
      d='M6 8 L20 18 L6 28'
      fill='none'
      stroke='currentColor'
      stroke-width='4'
      stroke-linecap='round'
      stroke-linejoin='round'
    )
    text(x='26' y='21') {{ variable.color || '-' }}.{{ variable.tone || '-' }}
</template>

<style scoped>
.hd-variable-arrow {
  color: rgba(248, 250, 252, 0.82);
  font-size: 12px;
  font-weight: 700;
}

.hd-variable-arrow text {
  fill: currentColor;
}

.hd-variable-arrow.top-left {
  transform: translate(350px, 252px);
}

.hd-variable-arrow.bottom-left {
  transform: translate(350px, 310px);
}

.hd-variable-arrow.top-right {
  transform: translate(642px, 252px);
}

.hd-variable-arrow.bottom-right {
  transform: translate(642px, 310px);
}
</style>
