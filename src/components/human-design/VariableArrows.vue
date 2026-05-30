<script setup>
defineProps({
  variables: { type: Array, default: () => [] },
})

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
    title {{ variable.label }} · {{ variable.orientation }}
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
  transform: translate(424px, 252px);
}

.hd-variable-arrow.bottom-left {
  transform: translate(424px, 304px);
}

.hd-variable-arrow.top-right {
  transform: translate(562px, 252px);
}

.hd-variable-arrow.bottom-right {
  transform: translate(562px, 304px);
}
</style>
