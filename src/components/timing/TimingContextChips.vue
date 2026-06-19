<script setup>
defineProps({
  dateLabel:    { type: String, default: '' },
  contactCount: { type: Number, default: 0 },
  dateText:     { type: String, required: true },
  contactsText: { type: String, required: true },
})
</script>

<template lang="pug">
.flex.flex-wrap.gap-2.mb-5(data-testid='timing-context-chips')
  .rounded-full.px-2.py-1.text-xs(class='bg-white/5 text-slate-300')
    span.text-slate-500 {{ dateText }}
    span.ml-1 {{ dateLabel }}
  .rounded-full.px-2.py-1.text-xs(class='bg-white/5 text-slate-300')
    span.text-slate-500 {{ contactsText }}
    span.ml-1 {{ contactCount }}
</template>
