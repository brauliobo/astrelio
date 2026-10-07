<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template lang="pug">
.ui-panel.text-center(data-testid='synastry-empty')
  h2.text-base.font-semibold.text-slate-100 {{ t('relationship.empty_title') }}
  p.mt-2.text-sm.text-slate-400 {{ t('relationship.empty_description') }}
  RouterLink.ui-control.mt-4.inline-block.px-4.py-2.text-sm.font-medium(
    :to='{ name: "home", query: { new: 1 } }'
    data-testid='synastry-empty-cta'
  ) {{ t('relationship.empty_action') }}
</template>
