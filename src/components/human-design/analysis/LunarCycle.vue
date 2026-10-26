<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { channelKey } from '../../../lib/human-design/activations.js'
import { HARMONIC_GATES } from '../../../lib/human-design/constants.js'
import { lunarCycleGate, moonGateMap } from '../../../lib/human-design/cycles.js'
import { lineContent } from '../../../lib/human-design/content/index.js'
import { humanDesignChannelLabel, humanDesignContentKey, humanDesignGateLabel } from '../../../lib/human-design/labels.js'
import PlanetGlyph from './PlanetGlyph.vue'

const props = defineProps({
  chart:     { type: Object, required: true },
  now:       { type: Number, required: true },
  prominent: { type: Boolean, default: false },
})

defineEmits(['select'])

const { t, locale } = useI18n()
const moon          = computed(() => lunarCycleGate(props.now))
const content       = computed(() => lineContent(locale.value, moon.value.gate, moon.value.line))
const when          = ms => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(ms)
const completes     = gate => (HARMONIC_GATES[gate] ?? []).filter(partner => props.chart.gates.includes(partner)).map(partner => channelKey(gate, partner))
const days          = computed(() => (props.prominent ? moonGateMap(props.now).map(segment => ({ ...segment, channels: completes(segment.gate) })).filter(segment => segment.channels.length) : []))
const channelText   = channels => channels.map(key => `${key} · ${humanDesignChannelLabel(t, key)}`).join(', ')
</script>

<template lang="pug">
section.hda-card(:data-prominent='prominent' data-testid='analysis-lunar')
  header.hda-card-head
    span.hda-moon(aria-hidden='true')
      PlanetGlyph(planet='Moon' :size='26')
    div
      h3.hda-title {{ t('human_design.ui.analysis.moon_now') }}
      p.hda-sub {{ t('human_design.ui.analysis.moon_in', { gate: `${moon.gate}.${moon.line}`, name: humanDesignGateLabel(t, moon.gate) }) }}
  p.hda-body {{ t(humanDesignContentKey('cycles', 'lunar', 'summary')) }}
  p.hda-quote
    strong {{ content.keynote }}
    br
    | {{ content.text }}
  p.hda-sub {{ t('human_design.ui.analysis.moon_next', { gate: moon.nextGateChange.gate, name: humanDesignGateLabel(t, moon.nextGateChange.gate), when: when(moon.nextGateChange.ms) }) }}
  p.hda-sub(v-if='completes(moon.gate).length') {{ t('human_design.ui.analysis.moon_completes', { channels: channelText(completes(moon.gate)) }) }}

  section.hda-section(v-if='days.length' data-testid='analysis-lunar-map')
    h4.hda-h {{ t('human_design.ui.analysis.moon_map') }}
    ol.hda-list
      li.hda-item(v-for='segment in days' :key='segment.enterMs')
        .hda-split
          button.hda-chip(type='button' @click='$emit("select", { type: "gate", value: segment.gate })') {{ segment.gate }} · {{ humanDesignGateLabel(t, segment.gate) }}
          span.hda-sub {{ when(segment.enterMs) }}
        p.hda-sub {{ t('human_design.ui.analysis.moon_completes', { channels: channelText(segment.channels) }) }}
</template>

<style scoped>
.hda-moon { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border: 1px solid var(--hda-line); border-radius: 50%; background: var(--hd-surface); }
.hda-card[data-prominent="true"] { border: 2px solid var(--hd-text); }
</style>
