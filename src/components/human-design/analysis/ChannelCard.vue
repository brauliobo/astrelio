<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignChannelLabel, humanDesignGateLabel, humanDesignStreamLabel, humanDesignValueLabel } from '../../../lib/human-design/labels.js'
import ActivationTag from './ActivationTag.vue'
import CenterGlyph from './CenterGlyph.vue'
import { activationsOf } from './model.js'

const props = defineProps({
  chart:   { type: Object, required: true },
  channel: { type: Object, required: true },
  pinned:  { type: Boolean, default: false },
})

defineEmits(['select'])

const { t }   = useI18n()
const holders = computed(() => props.channel.gates.map(gate => ({ gate, tags: activationsOf(props.chart, gate) })))
const themes  = computed(() => [props.channel.isLove && 'love', props.channel.isMaterial && 'material'].filter(Boolean))
</script>

<template lang="pug">
article.hda-card(:data-channel='channel.channel' :data-pinned='pinned' data-testid='analysis-channel')
  header.hda-card-head
    .hda-pair(aria-hidden='true')
      span {{ channel.gates[0] }}
      span.hda-pair-bar
      span {{ channel.gates[1] }}
    div
      h4.hda-title {{ channel.channel }} · {{ humanDesignChannelLabel(t, channel.channel, channel.name) }}
      .hda-row
        template(v-for='(center, index) in channel.centers' :key='center')
          span.hda-mark(v-if='index') →
          span.hda-mark
            CenterGlyph(:center='center' state='defined' :size='22')
            | {{ humanDesignValueLabel(t, 'center', center) }}

  .hda-row
    span.hda-chip(data-tone='strong') {{ humanDesignValueLabel(t, 'circuit', channel.circuit) }}
    span.hda-chip {{ humanDesignStreamLabel(t, channel.stream) }}
    span.hda-chip(v-for='theme in themes' :key='theme' data-tone='warn') {{ t(`human_design.${theme}_theme`) }}

  ul.hda-list
    li.hda-item(v-for='holder in holders' :key='holder.gate')
      .hda-split
        button.hda-chip(type='button' @click='$emit("select", { type: "gate", value: holder.gate })') {{ holder.gate }} · {{ humanDesignGateLabel(t, holder.gate) }}
        .hda-row
          ActivationTag(v-for='tag in holder.tags' :key='`${tag.layer}-${tag.planet}`' :layer='tag.layer' :planet='tag.planet' :code='tag.code')
  button.hda-btn(type='button' @click='$emit("select", { type: "channel", value: channel.channel })') {{ t('human_design.ui.analysis.show_on_chart') }}
</template>

<style scoped>
.hda-pair { display: grid; grid-template-columns: auto 10px auto; align-items: center; gap: 2px; flex: none; font-size: 15px; font-weight: 750; font-variant-numeric: tabular-nums; }
.hda-pair > span:not(.hda-pair-bar) { display: grid; place-items: center; min-width: 34px; height: 34px; border: 1px solid var(--hda-line); border-radius: 10px; background: var(--hd-surface); }
.hda-pair-bar { height: 3px; border-radius: 2px; background: var(--hd-text-muted); }
</style>
