<script setup>
defineProps({
  title: { type: String, required: true },
  open:  { type: Boolean, default: false },
})
</script>

<template lang="pug">
details.ui-panel(:open='open')
  summary.cursor-pointer.text-sm.font-semibold.text-slate-100 {{ title }}
  .mt-4
    slot
</template>
