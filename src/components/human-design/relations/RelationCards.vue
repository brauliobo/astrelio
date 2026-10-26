<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanDesignChannelLabel, humanDesignContentKey } from '../../../lib/human-design/labels.js'
import { channelHighlight, RELATIONS, relationRows } from '../../../lib/human-design/relations.js'

const props = defineProps({
  connection: { type: Object, required: true },
  owners:     { type: Object, required: true },
})

const emit  = defineEmits(['highlight'])
const { t } = useI18n()

const content = (relation, field) => t(humanDesignContentKey('relationships', relation, field))
const cards   = computed(() => RELATIONS.map(relation => ({ relation, rows: relationRows(props.connection, relation) })))
const show    = channel => emit('highlight', channelHighlight(channel))
</script>

<template lang="pug">
.grid.gap-3(class='md:grid-cols-2' data-testid='hd-relation-cards')
  article.hd-relation-card.rounded.border.p-4(
    v-for='{ relation, rows } in cards'
    :key='relation'
    class='border-white/10 bg-white/5'
    :data-relation='relation'
  )
    header.flex.items-center.justify-between.gap-2
      h3.text-sm.font-semibold.text-slate-100 {{ content(relation, 'name') }}
      span.rounded-full.px-2.text-xs.font-semibold(class='bg-white/10 py-0.5 text-slate-200') {{ rows.length }}
    p.mt-2.text-xs.leading-5.text-slate-400 {{ content(relation, 'summary') }}
    ul.mt-3.flex.flex-wrap.gap-2(v-if='rows.length')
      li(v-for='row in rows' :key='row.channel')
        button.rounded.border.px-2.py-1.text-left.text-xs(
          type='button'
          class='border-white/10 bg-slate-950/25 text-slate-100 hover:bg-white/10'
          :data-channel='row.channel'
          @pointerenter='show(row.channel)'
          @pointerleave='emit("highlight", null)'
          @focus='show(row.channel)'
          @blur='emit("highlight", null)'
        )
          | {{ row.channel }} · {{ humanDesignChannelLabel(t, row.channel) }}
          span.block.text-slate-400(v-if='row.owner') {{ t('human_design.ui.relations.holds_whole', { name: owners[row.owner] }) }}
    p.mt-3.text-xs.text-slate-500(v-else) {{ t('human_design.ui.relations.no_channels') }}
</template>
