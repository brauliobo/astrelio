<script setup>
import { computed } from 'vue'
import CenterDetailTable from './CenterDetailTable.vue'
import ChannelDetailTable from './ChannelDetailTable.vue'
import GateDetailTable from './GateDetailTable.vue'

const props = defineProps({
  chart: { type: Object, required: true },
  mode: { type: String, required: true },
})

const tableComponents = {
  centers: CenterDetailTable,
  channels: ChannelDetailTable,
  gates: GateDetailTable,
}

const tableComponent = computed(() => tableComponents[props.mode] || GateDetailTable)
</script>

<template lang="pug">
.hd-detail-tables(data-testid='hd-detail-tables')
  component(:is='tableComponent' :chart='chart')
</template>
