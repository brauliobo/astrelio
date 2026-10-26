<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignContentKey, humanDesignValueLabel } from '../../../lib/human-design/labels.js'

const props = defineProps({
  connection: { type: Object, required: true },
})

const { t } = useI18n()

const facts = computed(() => ['type', 'authority', 'definition'].map(group => ({
  group,
  value: humanDesignValueLabel(t, group, props.connection.composite[group]),
})))
</script>

<template lang="pug">
div
  dl.grid.gap-2(class='grid-cols-2 sm:grid-cols-3')
    .rounded.border.px-3.py-2(v-for='fact in facts' :key='fact.group' class='border-white/10 bg-white/5')
      dt.text-xs.uppercase.tracking-wide.text-slate-500 {{ t(`human_design.${fact.group}`) }}
      dd.text-sm.font-semibold.text-slate-100 {{ fact.value || '—' }}
  p.mt-3.text-xs.leading-5.text-slate-400 {{ t(humanDesignContentKey('relationships', 'composite', 'summary')) }}
</template>
