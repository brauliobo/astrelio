<script setup>
import { useI18n } from 'vue-i18n'
import { humanDesignContentKey, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import { ARROWS } from '../../../lib/human-design/variables.js'

defineProps({ variables: { type: Object, required: true } })

const { t } = useI18n()
const text  = (...parts) => t(humanDesignContentKey('variables', ...parts))
const SIDES = ['design', 'personality']
const sides = SIDES.map(layer => ({ layer, ids: ARROWS.filter(arrow => arrow.layer === layer).map(arrow => arrow.id) }))
</script>

<template lang="pug">
section.hda-card(data-testid='analysis-variables')
  header.hda-split
    div
      h3.hda-title {{ t('human_design.variables') }}
      p.hda-sub {{ text('shorthand', 'note') }}
    strong.hda-code(data-testid='analysis-variable-code') {{ variables.shorthand }}

  .hda-sides
    .hda-section(v-for='side in sides' :key='side.layer' :data-layer='side.layer')
      h4.hda-h
        span.hda-dot(:data-layer='side.layer' aria-hidden='true')
        |  {{ humanDesignValueLabel(t, 'layer', side.layer) }}
      article.hda-item.hda-arrow(v-for='id in side.ids' :key='id' :data-arrow='id' :data-orientation='variables.arrows[id].orientation')
        .hda-arrow-head
          svg.hda-arrow-glyph(viewBox='0 0 48 24' aria-hidden='true')
            path(v-if='variables.arrows[id].orientation === "left"' d='M44 12H6M15 3L5 12l10 9')
            path(v-else d='M4 12h38M33 3l10 9-10 9')
          div
            strong {{ t(`human_design.variable_labels.${id}.label`) }}
            span.hda-sub  · {{ t(`human_design.variable_labels.${id}.subtitle`) }}
            .hda-row
              span.hda-chip {{ t(`human_design.orientations.${variables.arrows[id].orientation}`) }}
              span.hda-chip {{ variables.arrows[id].color }} · {{ t(`human_design.variable_colors.${id}.${variables.arrows[id].color}`) }}
              span.hda-chip {{ t('human_design.tone') }} {{ variables.arrows[id].tone }}
        p.hda-sub {{ text('arrows', variables.arrows[id].orientation, id, 'summary') }}
        p.hda-sub {{ text('colors', id, variables.arrows[id].color, 'summary') }}

  .hda-grid
    article.hda-item(data-testid='analysis-cognition')
      h4.hda-h {{ t('human_design.ui.analysis.cognition') }}
      strong {{ text('cognition', variables.cognition.key, 'name') }}
      p.hda-sub {{ text('cognition', variables.cognition.key, 'summary') }}
    article.hda-item(data-testid='analysis-transference')
      h4.hda-h {{ t('human_design.ui.analysis.transference') }}
      strong {{ variables.transference.color }} · {{ t(`human_design.variable_colors.motivation.${variables.transference.color}`) }}
      p.hda-sub {{ text('colors', 'motivation', variables.transference.color, 'summary') }}
    article.hda-item(data-testid='analysis-distraction')
      h4.hda-h {{ t('human_design.ui.analysis.distraction') }}
      strong {{ variables.distraction.color }} · {{ t(`human_design.variable_colors.perspective.${variables.distraction.color}`) }}
      p.hda-sub {{ text('colors', 'perspective', variables.distraction.color, 'summary') }}
</template>

<style scoped>
.hda-code { padding: 6px 12px; border-radius: 10px; background: var(--hd-text); color: var(--hd-surface); font-size: 16px; letter-spacing: 0.06em; font-variant-numeric: tabular-nums; }
.hda-sides { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); min-width: 0; }
.hda-arrow { border-left: 4px solid var(--hd-text-muted); }
.hda-sides [data-layer="design"] .hda-arrow { border-left-color: var(--hd-design); }
.hda-sides [data-layer="personality"] .hda-arrow { border-left-color: var(--hd-personality); }
.hda-arrow-head { display: flex; gap: 12px; align-items: center; min-width: 0; }
.hda-arrow-head > div { min-width: 0; display: grid; gap: 4px; }
.hda-arrow-glyph { flex: none; width: 44px; height: 22px; fill: none; stroke: var(--hd-text); stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
</style>
