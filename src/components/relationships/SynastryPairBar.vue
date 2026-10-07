<script setup>
import { useI18n } from 'vue-i18n'
import RelationshipModalitySwitch from './RelationshipModalitySwitch.vue'

defineProps({
  people:  { type: Array, required: true },
  personA: { type: Object, default: null },
  personB: { type: Object, default: null },
})
const emit = defineEmits(['update:a', 'update:b', 'swap'])

const { t } = useI18n()
</script>

<template lang="pug">
.synastry-pair-bar.flex.flex-wrap.items-center.gap-2(data-testid='synastry-pair-bar')
  .flex.min-w-0.flex-1.items-center.gap-2(class='basis-72')
    select.ui-control.ui-control-sm.min-w-0.flex-1(
      :aria-label='t("relationship.person_a")'
      data-testid='synastry-person-a'
      @change='emit("update:a", $event.target.value)'
    )
      option(v-for='p in people' :key='p.id' :value='p.id' :selected='p.id === personA?.id') {{ p.name }}
    button.ui-control.ui-control-sm.shrink-0(
      type='button'
      :aria-label='t("relationship.swap")'
      :title='t("relationship.swap")'
      data-testid='synastry-swap'
      @click='emit("swap")'
    ) ⇄
    select.ui-control.ui-control-sm.min-w-0.flex-1(
      :aria-label='t("relationship.person_b")'
      data-testid='compare-select'
      @change='emit("update:b", $event.target.value)'
    )
      option(value='' :selected='!personB') —
      option(v-for='p in people' :key='p.id' :value='p.id' :selected='p.id === personB?.id') {{ p.name }}
  RelationshipModalitySwitch
</template>
