<script setup>
defineProps({ title: { type: String, default: '' } })
</script>

<template lang="pug">
section.hd-block
  h4.hd-kicker(v-if='title') {{ title }}
  slot
</template>

<style scoped>
.hd-block { display: grid; gap: 8px; min-width: 0; }
.hd-block h4 { margin: 0; }
</style>
