<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  variables: { type: Array, default: () => [] },
})

const { t } = useI18n()
const variableLabel = variable => t(`human_design.variable_labels.${variable.id}.label`)
const variableSubtitle = variable => t(`human_design.variable_labels.${variable.id}.subtitle`)
const variableColorLabel = variable => {
  if (!variable?.id || !variable?.color) return variable?.colorLabel || variable?.code || ''
  const key = `human_design.variable_colors.${variable.id}.${variable.color}`
  const translated = t(key)
  return translated === key ? variable.colorLabel || variable.code : translated
}
</script>

<template lang="pug">
.hd-variable-summary(data-testid='hd-variable-summary')
  .grid.gap-3(class='sm:grid-cols-2 lg:grid-cols-4')
    article.hd-variable(
      v-for='variable in variables'
      :key='variable.id'
      :data-variable='variable.id'
    )
      .flex.items-center.justify-between.gap-2
        div
          h3.text-sm.font-semibold.text-slate-100 {{ variableLabel(variable) }}
          p.text-xs.text-slate-500 {{ variableSubtitle(variable) }}
        .hd-variable__arrow(:class='variable.orientation') {{ variable.orientation === 'left' ? '‹' : '›' }}
      .mt-3.grid.grid-cols-3.gap-2.text-xs
        div
          .text-slate-500 {{ t('human_design.color') }}
          .text-slate-200 {{ variable.color || '-' }}
        div
          .text-slate-500 {{ t('human_design.tone') }}
          .text-slate-200 {{ variable.tone || '-' }}
        div
          .text-slate-500 {{ t('human_design.base') }}
          .text-slate-200 {{ variable.base || '-' }}
      p.mt-3.text-xs.leading-5.text-slate-400 {{ variableColorLabel(variable) }}
</template>

<style scoped>
.hd-variable {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.045);
  padding: 12px;
}

.hd-variable__arrow {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f8fafc;
  font-size: 26px;
  line-height: 1;
}

.hd-variable__arrow.right {
  color: #fbbf24;
}
</style>
