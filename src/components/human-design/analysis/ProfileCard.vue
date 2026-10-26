<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { msToJd } from '../../../lib/astro/timezones.js'
import { humanDesignContentKey, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import { LINE_6_STAGES, hasLine6, line6Stage } from '../../../lib/human-design/profiles.js'

const props = defineProps({
  chart: { type: Object, required: true },
  now:   { type: Number, required: true },
})

const { t }     = useI18n()
const text      = (...parts) => t(humanDesignContentKey(...parts))
const profile   = computed(() => props.chart.profileInfo)
const age       = computed(() => (msToJd(props.now) - props.chart.birthJd) / 365.25)
const current   = computed(() => profile.value && line6Stage(profile.value, age.value))
const hasStages = computed(() => profile.value && hasLine6(profile.value))
const angle     = computed(() => humanDesignValueLabel(t, 'crossGeometry', profile.value.angleName))
const sides     = computed(() => [
  { id: 'conscious',   layer: 'personality', line: profile.value.conscious },
  { id: 'unconscious', layer: 'design',      line: profile.value.unconscious },
])
const range     = stage => (Number.isFinite(stage.toAge) ? `${stage.fromAge}–${stage.toAge}` : `${stage.fromAge}+`)
</script>

<template lang="pug">
section.hda-card(data-testid='analysis-profile')
  template(v-if='profile')
    header.hda-card-head
      span.hda-profile-key(aria-hidden='true') {{ profile.key }}
      div
        h3.hda-title {{ t('human_design.profile') }} {{ profile.key }}
        p.hda-sub {{ text('profiles', profile.id, 'name') }} · {{ angle }}
    p.hda-body {{ text('profiles', profile.id, 'summary') }}
    p.hda-body {{ text('crosses', profile.angle, 'summary') }}

    .hda-grid
      article.hda-item(v-for='side in sides' :key='side.id' :data-side='side.id')
        .hda-split
          h4.hda-h {{ t(`human_design.ui.analysis.${side.id}`) }}
          span.hda-mark
            span.hda-dot(:data-layer='side.layer' aria-hidden='true')
            | {{ humanDesignValueLabel(t, 'layer', side.layer) }} {{ t('planets.Sun') }}
        strong {{ side.line }} · {{ text('line_archetypes', side.line, 'name') }}
        p.hda-sub {{ text('line_archetypes', side.line, 'summary') }}

    section.hda-section(v-if='hasStages' data-testid='analysis-line6')
      h4.hda-h {{ t('human_design.ui.analysis.line6_title') }}
      ol.hda-stages
        li.hda-stage(v-for='stage in LINE_6_STAGES' :key='stage.id' :data-current='current && current.id === stage.id')
          strong {{ t(`human_design.ui.analysis.stage_${stage.id}`) }}
          span.hda-sub {{ range(stage) }}
          span.hda-chip(v-if='current && current.id === stage.id' data-tone='strong') {{ t('human_design.ui.analysis.you_are_here') }}
      p.hda-body {{ text('line6_stages', current.id, 'summary') }}
  template(v-else)
    h3.hda-title {{ t('human_design.profile') }} {{ chart.profile }}
    p.hda-body {{ t('human_design.ui.analysis.profile_unlisted') }}
</template>

<style scoped>
.hda-profile-key { display: grid; place-items: center; flex: none; min-width: 64px; height: 56px; padding: 0 10px; border-radius: 14px; background: var(--hd-text); color: var(--hd-surface); font-size: 24px; font-weight: 800; letter-spacing: 0.02em; }
.hda-stages { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 0; padding: 0; list-style: none; }
.hda-stage { display: grid; gap: 2px; align-content: start; justify-items: start; padding: 8px 10px; border: 1px solid var(--hda-line); border-radius: 10px; background: var(--hd-surface); font-size: 13px; overflow-wrap: anywhere; }
.hda-stage[data-current="true"] { border: 2px solid var(--hd-text); background: var(--hda-soft); }
</style>
