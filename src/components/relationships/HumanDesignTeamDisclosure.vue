<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { modalityChart } from '../../lib/modalities/index.js'
import { humanDesignTeamAnalysis } from '../../lib/human-design/bodygraph.js'
import TeamPanel from '../human-design/TeamPanel.vue'

const props = defineProps({
  people: { type: Array, default: () => [] },
})

const { t }           = useI18n()
const isOpen          = ref(false)
const selectedTeamIds = ref([])
const teamIds         = computed(() => selectedTeamIds.value.length
  ? selectedTeamIds.value
  : props.people.slice(0, 5).map(person => person.id)
)
const teamAnalysis = computed(() => humanDesignTeamAnalysis(
  teamIds.value.map(id => modalityChart('humanDesign', props.people.find(person => person.id === id))).filter(Boolean)
))

const setOpen = event => { isOpen.value = event.currentTarget.open }
const toggleTeamPerson = id => {
  const ids = new Set(teamIds.value)
  if (ids.has(id)) ids.delete(id)
  else if (ids.size < 5) ids.add(id)
  selectedTeamIds.value = [...ids]
}
</script>

<template lang="pug">
details.ui-panel.mt-6(@toggle='setOpen' data-testid='human-design-team-disclosure')
  summary.cursor-pointer.text-sm.font-semibold.text-slate-100(data-testid='human-design-team-toggle') {{ t('human_design.team') }}
  .mt-5(v-if='isOpen')
    TeamPanel(
      :analysis='teamAnalysis'
      :people='people'
      :selected-ids='teamIds'
      @toggle='toggleTeamPerson'
    )
</template>
