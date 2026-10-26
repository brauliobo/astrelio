<script setup>
import { useI18n } from 'vue-i18n'
import CrossCard from './CrossCard.vue'
import ProfileCard from './ProfileCard.vue'
import VariablesCard from './VariablesCard.vue'

defineProps({
  chart:  { type: Object, required: true },
  pinned: { type: Object, default: null },
  now:    { type: Number, required: true },
})

defineEmits(['select'])

const { t } = useI18n()
</script>

<template lang="pug">
.hda-panel(data-testid='analysis-profile-view')
  p.hda-intro {{ t('human_design.ui.analysis.profile_intro') }}
  ProfileCard(:chart='chart' :now='now')
  CrossCard(:chart='chart' @select='$emit("select", $event)')
  VariablesCard(v-if='chart.variableDetails' :variables='chart.variableDetails')
  p.hda-empty(v-else) {{ t('human_design.variable_notice') }}
</template>
