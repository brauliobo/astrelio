<script setup>
defineProps({
  kicker: { type: String, required: true },
  title:  { type: String, required: true },
})
</script>

<template lang="pug">
header.hd-head
  .hd-kicker {{ kicker }}
  h3.hd-title {{ title }}
  .hd-head-chips
    slot
</template>

<style scoped>
.hd-head { display: grid; gap: 6px; min-width: 0; }
.hd-head h3 { overflow-wrap: anywhere; }
.hd-head-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.hd-head-chips:empty { display: none; }
</style>
