<script setup>
import { useI18n } from 'vue-i18n'
import { VIEW_MODES } from '../../lib/planetarium/constants.js'

defineProps({ view: { type: String, required: true } })
const emit = defineEmits(['select'])
const { t } = useI18n()
</script>

<template lang="pug">
nav.planetarium-views(:aria-label='t("planetarium.views_aria")' data-testid='planetarium-views')
  button.planetarium-views__item(
    v-for='mode in VIEW_MODES'
    :key='mode'
    type='button'
    :class='{ "is-active": view === mode }'
    :aria-pressed='view === mode'
    :title='t(`planetarium.views.${mode}.hint`)'
    :data-testid='`planetarium-view-${mode}`'
    @click='emit("select", mode)'
  )
    span.planetarium-views__glyph(aria-hidden='true') {{ t(`planetarium.views.${mode}.glyph`) }}
    span.planetarium-views__label {{ t(`planetarium.views.${mode}.label`) }}
</template>

<style scoped>
.planetarium-views {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.planetarium-views__item {
  align-items: center;
  background: color-mix(in srgb, var(--app-panel-strong) 82%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.7rem;
  color: var(--app-text-soft);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.35rem;
  transition: background-color 140ms ease, color 140ms ease;
  width: 4.4rem;
}

.planetarium-views__item:hover {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.planetarium-views__item.is-active {
  background: rgb(252 211 77);
  border-color: rgb(252 211 77);
  color: rgb(15 23 42);
}

.planetarium-views__glyph {
  font-size: 1.1rem;
  line-height: 1.2;
}

.planetarium-views__label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
}

@media (max-width: 52rem) {
  .planetarium-views {
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .planetarium-views__item {
    flex: 0 0 auto;
  }
}
</style>
