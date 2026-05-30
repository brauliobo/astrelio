<script setup>
defineProps({
  variables: { type: Array, default: () => [] },
})
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
          h3.text-sm.font-semibold.text-slate-100 {{ variable.label }}
          p.text-xs.text-slate-500 {{ variable.subtitle }}
        .hd-variable__arrow(:class='variable.orientation') {{ variable.orientation === 'left' ? '‹' : '›' }}
      .mt-3.grid.grid-cols-3.gap-2.text-xs
        div
          .text-slate-500 Color
          .text-slate-200 {{ variable.color || '-' }}
        div
          .text-slate-500 Tone
          .text-slate-200 {{ variable.tone || '-' }}
        div
          .text-slate-500 Base
          .text-slate-200 {{ variable.base || '-' }}
      p.mt-3.text-xs.leading-5.text-slate-400 {{ variable.colorLabel || variable.code }}
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
