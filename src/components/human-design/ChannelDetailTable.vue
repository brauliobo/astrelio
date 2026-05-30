<script setup>
import { useI18n } from 'vue-i18n'
import {
  humanDesignChannelLabel as channelLabel,
  humanDesignListLabel as listLabel,
  humanDesignStreamLabel as streamLabel,
  humanDesignValueLabel as valueLabel,
} from '../../lib/human-design/labels.js'

defineProps({
  chart: { type: Object, required: true },
})

const { t } = useI18n()
</script>

<template lang="pug">
.overflow-x-auto
  table.w-full.text-sm
    thead.text-xs.text-slate-500
      tr.border-b(class='border-white/10')
        th.py-2.pr-3.text-left {{ t('human_design.channel') }}
        th.py-2.px-3.text-left {{ t('human_design.centers_title') }}
        th.py-2.px-3.text-left {{ t('human_design.circuit') }}
        th.py-2.px-3.text-left {{ t('human_design.stream') }}
        th.py-2.pl-3.text-left {{ t('human_design.source') }}
    tbody.divide-y(class='divide-white/10')
      tr(v-for='channel in chart.details.channels' :key='channel.channel')
        td.py-2.pr-3.text-slate-100 {{ channel.channel }} · {{ channelLabel(t, channel.channel, channel.name) }}
        td.py-2.px-3.text-slate-300 {{ listLabel(t, 'center', channel.centers) }}
        td.py-2.px-3.text-slate-300 {{ valueLabel(t, 'circuit', channel.circuit) }}
        td.py-2.px-3.text-slate-300 {{ streamLabel(t, channel.stream) }}
        td.py-2.pl-3.text-slate-400 {{ valueLabel(t, 'layer', channel.source) }}
      tr(:hidden='chart.details.channels.length')
        td.py-3.text-slate-400(colspan='5') {{ t('human_design.no_defined_channels') }}
</template>
