<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../../stores/settings.js'
import ModalityRouteSwitch from '../modalities/ModalityRouteSwitch.vue'
import WorkspaceViewSwitch from '../modalities/WorkspaceViewSwitch.vue'

const props = defineProps({
  lens: { type: String, default: 'astrology' },
  view: { type: String, default: 'chart' },
})

const { t }    = useI18n()
const settings = useSettingsStore()

const canonicalLenses = { astrology: 'astrology', vedic: 'vedic', humanDesign: 'human-design' }
const canonicalLens   = computed(() => canonicalLenses[props.lens] || 'astrology')
const systemLabel     = computed(() => ({
  vedic:       `${t('modalities.vedic')} · ${t(`vedic.ayanamshas.${settings.vedic.ayanamsha}`)}`,
  humanDesign: t('modalities.human_design'),
})[props.lens] || `${t(`settings.${settings.zodiac}`)} · ${t(`houses.${settings.houseSystem}`)}`)
</script>

<template lang="pug">
.map-toolbar.flex.flex-wrap.items-center.gap-x-3.gap-y-2.mb-3(data-testid='map-toolbar')
  ModalityRouteSwitch(:active='lens' :view='view' workspace-owner)
  WorkspaceViewSwitch(:active='view' :lens='canonicalLens')
  RouterLink.map-toolbar__system(
    :to='{ name: "settings" }'
    :title='t("context.system")'
    data-testid='context-system'
  ) {{ systemLabel }}
</template>

<style scoped>
.map-toolbar__system {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-muted);
  font-size: 0.72rem;
  line-height: 1rem;
  margin-left: auto;
  padding: 0.25rem 0.625rem;
  text-decoration: none;
}

.map-toolbar__system:hover,
.map-toolbar__system:focus-visible {
  background: var(--app-chip-hover);
  color: var(--app-heading);
  outline: none;
}

@media print {
  .map-toolbar {
    display: none !important;
  }
}
</style>
