<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLogo from '../AppLogo.vue'
import AppCommandPalette from '../AppCommandPalette.vue'
import PersonSwitcher from './PersonSwitcher.vue'
import PreferencesMenu from './PreferencesMenu.vue'
import WorkspaceNav from './WorkspaceNav.vue'

defineProps({
  person:   { type: Object, default: null },
  activeId: { type: String, default: null },
  chart:    { type: Object, default: null },
})

const { t } = useI18n()
</script>

<template lang="pug">
header.app-header.top-bar.sticky.top-0.z-20.border-b
  .top-bar__inner.mx-auto.max-w-6xl.px-4
    RouterLink.top-bar__brand(to='/' data-testid='brand' :aria-label='t("app.title")')
      AppLogo
    WorkspaceNav
    .top-bar__tools
      PersonSwitcher(:person='person' :active-id='activeId')
      .top-bar__utilities(data-testid='shell-utilities')
        AppCommandPalette(:chart='chart')
        PreferencesMenu
</template>

<style scoped>
/* The blur lives on a pseudo-element so the header does not become the containing block of the fixed bottom nav. */
.top-bar::before {
  backdrop-filter: blur(12px);
  content: '';
  inset: 0;
  position: absolute;
  z-index: -1;
}

.top-bar__inner {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  height: 3.1875rem;
  min-width: 0;
}

.top-bar__brand {
  flex: 0 0 auto;
}

.top-bar__tools,
.top-bar__utilities {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  min-width: 0;
}

.top-bar__tools {
  margin-left: auto;
}

.top-bar__utilities {
  flex: 0 0 auto;
}

@media (max-width: 52rem) {
  .top-bar__inner {
    gap: 0.5rem;
  }

  .top-bar__brand :deep(.logo-word) {
    display: none;
  }
}
</style>
