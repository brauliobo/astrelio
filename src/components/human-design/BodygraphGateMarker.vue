<script setup>
defineProps({
  item: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
  dimmed: { type: Boolean, default: false },
})

const emit = defineEmits(['hover', 'leave'])

const splitPath = (item, side, radius) => {
  const sweep = side === 'right' ? 1 : 0
  return [
    `M ${item.x} ${item.y - radius}`,
    `A ${radius} ${radius} 0 0 ${sweep} ${item.x} ${item.y + radius}`,
    `L ${item.x} ${item.y - radius}`,
    'Z',
  ].join(' ')
}
</script>

<template lang="pug">
g(
  :data-gate='item.gate'
  :data-active='String(item.active)'
  @pointerenter='emit("hover", item.gate)'
  @pointerleave='emit("leave")'
)
  template(v-if='item.active && item.parts?.length > 1')
    path(
      v-for='(part, index) in item.parts'
      :key='part.key'
      :d='splitPath(item, index === 0 ? "left" : "right", highlighted ? 17 : 15)'
      :fill='part.fill'
      :fill-opacity='dimmed ? 0.36 : 1'
      :data-gate='item.gate'
      :data-part='part.key'
      data-testid='bodygraph-gate-part'
      class='gate-dot'
    )
    circle(
      :cx='item.x'
      :cy='item.y'
      :r='highlighted ? 17 : 15'
      fill='transparent'
      :stroke='highlighted ? item.highlightStroke : item.stroke'
      :stroke-width='highlighted ? 3 : 2'
      :data-personality='String(item.personality)'
      :data-design='String(item.design)'
      class='gate-dot'
    )
  circle(
    v-else-if='item.active'
    :cx='item.x'
    :cy='item.y'
    :r='highlighted ? 17 : 15'
    :fill='item.fill'
    :fill-opacity='dimmed ? 0.36 : 1'
    :stroke='highlighted ? item.highlightStroke : item.stroke'
    :stroke-width='highlighted ? 3 : 2'
    :data-personality='String(item.personality)'
    :data-design='String(item.design)'
    class='gate-dot'
  )
  text(
    :x='item.x'
    :y='item.y + 4.2'
    text-anchor='middle'
    :fill='dimmed ? item.dimmedText : item.text || item.inactiveFill'
    :font-size='highlighted ? 16.5 : item.active ? 15 : 13.5'
    :font-weight='item.active || highlighted ? 800 : 700'
    class='gate-label'
  ) {{ item.gate }}
</template>

<style scoped>
g {
  cursor: pointer;
}

.gate-dot,
.gate-label {
  transition: fill-opacity 140ms ease, fill 140ms ease, r 140ms ease, stroke 140ms ease;
}
</style>
