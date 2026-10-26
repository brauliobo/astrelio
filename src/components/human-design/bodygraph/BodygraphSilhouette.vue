<script setup>
import { SILHOUETTE_PATH } from '../../../lib/human-design/layout.js'

const ARM_LINES = [
  'M118 300 C106 400 98 520 96 640 C95 690 93 724 90 746',
  'M418 300 C430 400 438 520 440 640 C441 690 443 724 446 746',
]
</script>

<template lang="pug">
g.silhouette(aria-hidden='true' data-testid='bodygraph-silhouette')
  path.body(:d='SILHOUETTE_PATH')
  path.arm(v-for='line in ARM_LINES' :key='line' :d='line')
</template>

<style scoped>
.silhouette {
  pointer-events: none;
}

.body {
  fill: var(--hd-figure);
  fill-opacity: var(--hd-figure-fill-opacity);
}

.body,
.arm {
  stroke: var(--hd-figure);
  stroke-opacity: var(--hd-figure-line-opacity);
  stroke-width: 1.5;
}

.arm {
  fill: none;
  stroke-opacity: calc(var(--hd-figure-line-opacity) * 0.9);
  stroke-linecap: round;
}
</style>
