<script setup>
defineProps({ state: { type: String, required: true }, label: { type: String, required: true } })
</script>

<template lang="pug">
span.hda-badge(:data-state='state')
  svg.hda-badge-icon(viewBox='0 0 16 16' aria-hidden='true')
    circle(v-if='state === "defined"' cx='8' cy='8' r='6' fill='currentColor')
    template(v-else-if='state === "undefined"')
      circle(cx='8' cy='8' r='5.5' fill='none' stroke='currentColor' stroke-width='1.8')
      path(d='M8 2.5 A5.5 5.5 0 0 0 8 13.5 Z' fill='currentColor')
    circle(v-else cx='8' cy='8' r='5.5' fill='none' stroke='currentColor' stroke-width='1.8' stroke-dasharray='3 2.2')
  | {{ label }}
</template>
