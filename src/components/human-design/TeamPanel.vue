<script setup>
defineProps({
  analysis: { type: Object, default: null },
  people: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['toggle'])
const isSelected = (id, selectedIds) => selectedIds.includes(id)
</script>

<template lang="pug">
.hd-team-panel(data-testid='hd-team-panel')
  .flex.flex-wrap.gap-2.mb-4
    button.rounded.px-3.py-2.text-xs(
      v-for='person in people'
      :key='person.id'
      type='button'
      :class='isSelected(person.id, selectedIds) ? "bg-amber-300 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/15"'
      @click='emit("toggle", person.id)'
    ) {{ person.name }}
  .grid.gap-4(v-if='analysis' class='lg:grid-cols-2')
    section
      h3.text-sm.font-semibold.text-slate-100.mb-3 Penta gates · {{ analysis.pentaPercent }}%
      .grid.grid-cols-2.gap-2(class='sm:grid-cols-3')
        .rounded.border.p-2.text-xs(
          v-for='item in analysis.pentaCoverage'
          :key='item.gate'
          :class='item.covered ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/5 text-slate-400"'
        )
          .font-semibold {{ item.gate }} · {{ item.name }}
          .mt-1 {{ item.owners.length ? `${item.owners.length} member(s)` : 'open' }}
    section
      h3.text-sm.font-semibold.text-slate-100.mb-3 Composite channels
      .grid.gap-2.text-xs
        .rounded.border.p-2(
          v-for='channel in analysis.compositeChannels'
          :key='channel.channel'
          class='border-white/10 bg-white/5'
        )
          .text-slate-100 {{ channel.channel }} · {{ channel.name }}
          .text-slate-400 {{ channel.centers.join(' / ') }}
        p.text-slate-400(v-if='!analysis.compositeChannels.length') No team composite channels yet.
</template>
