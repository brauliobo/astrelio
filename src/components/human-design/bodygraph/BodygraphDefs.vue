<script setup>
defineProps({ ids: { type: Object, required: true } })
</script>

<template lang="pug">
defs
  pattern(:id='ids.stripe' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)')
    rect.stripe-design(width='3' height='6')
    rect.stripe-personality(x='3' width='3' height='6')
  linearGradient(:id='ids.sheen' x1='0' y1='0' x2='0' y2='1')
    stop(offset='0' stop-color='#ffffff' stop-opacity='0.08')
    stop(offset='0.55' stop-color='#ffffff' stop-opacity='0')
    stop(offset='1' stop-color='#000000' stop-opacity='0.08')
  filter(:id='ids.glow' x='-30%' y='-30%' width='160%' height='160%')
    feGaussianBlur(stdDeviation='7')
</template>

<style scoped>
.stripe-design {
  fill: var(--hd-design);
}

.stripe-personality {
  fill: var(--hd-personality);
}
</style>
