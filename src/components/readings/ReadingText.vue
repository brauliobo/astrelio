<script setup>
import { sameHighlight } from '../../lib/chart/highlight.js'

const props = defineProps({
  row:             { type: Object, required: true },
  activeHighlight: { type: Object, default: null },
  pinnedHighlight: { type: Object, default: null },
})

defineEmits(['hover', 'clear-hover', 'toggle-pin'])

const highlightState = (item) => {
  if (!props.activeHighlight) return 'idle'
  return sameHighlight(props.activeHighlight, item.highlight) ? 'active' : 'dimmed'
}

const pinnedState = item => Boolean(
  props.pinnedHighlight && sameHighlight(props.pinnedHighlight, item.highlight)
)
</script>

<template lang="pug">
p.reading-text
  template(v-for='(segment, index) in row.segments' :key='index')
    button.reading-semantic-term(
      v-if='segment.keyword'
      type='button'
      :data-reading-keyword-kind='segment.keyword.kind'
      :data-reading-keyword-id='segment.keyword.id'
      :data-reading-keyword-highlight='highlightState(segment.keyword)'
      :data-reading-keyword-pinned='pinnedState(segment.keyword)'
      :aria-pressed='pinnedState(segment.keyword)'
      v-text='segment.text'
      @mouseenter='$emit("hover", segment.keyword, $event)'
      @mouseleave='$emit("clear-hover")'
      @focus='$emit("hover", segment.keyword, $event)'
      @blur='$emit("clear-hover")'
      @click='$emit("toggle-pin", segment.keyword, $event)'
      @keydown.enter.prevent='$emit("toggle-pin", segment.keyword, $event)'
      @keydown.space.prevent='$emit("toggle-pin", segment.keyword, $event)'
    )
    span(v-else v-text='segment.text')
</template>

<style scoped>
.reading-semantic-term {
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 0.2rem;
  color: inherit;
  cursor: pointer;
  display: inline;
  font: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;
  text-align: inherit;
  text-decoration-color: transparent;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.16em;
  transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease, text-decoration-color 120ms ease;
}

.reading-semantic-term:hover,
.reading-semantic-term:focus-visible,
.reading-semantic-term[data-reading-keyword-highlight='active'] {
  background: rgb(251 191 36 / 0.1);
  color: rgb(253 230 138);
  outline: none;
  text-decoration-color: rgb(252 211 77 / 0.7);
}

.reading-semantic-term[data-reading-keyword-highlight='dimmed'] {
  opacity: 0.52;
}
</style>
