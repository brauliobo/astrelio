<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const links = computed(() => [
  { id: 'charts',        to: '/',                    label: t('nav.charts'),      workspace: 'library' },
  { id: 'map',           to: '/map/astrology/chart', label: t('nav.map'),         workspace: 'map' },
  { id: 'timing',        to: '/timing/transits',     label: t('nav.timing'),      workspace: 'timing' },
  { id: 'relationships', to: '/synastry',            label: t('nav.relations'),   workspace: 'relations' },
  { id: 'planetarium',   to: '/planetarium',         label: t('nav.planetarium'), workspace: 'planetarium' },
])

const isActive = (link) => route.meta?.workspace === link.workspace
</script>

<template lang="pug">
nav.workspace-nav(:aria-label='t("shell.workspaces")')
  RouterLink.workspace-nav__link(
    v-for='link in links'
    :key='link.id'
    :to='link.to'
    :class='{ "is-active": isActive(link) }'
    :aria-current='isActive(link) ? "page" : undefined'
    :data-testid='`nav-${link.id}`'
  ) {{ link.label }}
</template>

<style scoped>
.workspace-nav {
  align-items: center;
  display: flex;
  gap: 0.25rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.workspace-nav::-webkit-scrollbar {
  display: none;
}

.workspace-nav__link {
  border-radius: 0.5rem;
  color: var(--app-text-soft);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.55rem 0.7rem;
  transition: background-color 140ms ease, color 140ms ease;
  white-space: nowrap;
}

.workspace-nav__link:hover,
.workspace-nav__link:focus-visible {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.workspace-nav__link.is-active {
  background: var(--app-chip);
  color: var(--app-accent-text);
}

@media (max-width: 52rem) {
  .workspace-nav {
    align-items: stretch;
    backdrop-filter: blur(12px);
    background: color-mix(in srgb, var(--app-bg) 94%, transparent);
    border-top: 1px solid var(--app-border-soft);
    bottom: 0;
    display: grid;
    gap: 0;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    height: calc(3.5rem + env(safe-area-inset-bottom));
    left: 0;
    overflow: visible;
    padding-bottom: env(safe-area-inset-bottom);
    position: fixed;
    right: 0;
  }

  .workspace-nav__link {
    align-items: center;
    border-radius: 0;
    display: flex;
    font-size: 0.75rem;
    justify-content: center;
    padding: 0 0.25rem;
    position: relative;
    text-align: center;
  }

  .workspace-nav__link.is-active {
    background: transparent;
  }

  .workspace-nav__link.is-active::before {
    background: var(--app-accent-text);
    border-radius: 0 0 2px 2px;
    content: '';
    height: 2px;
    left: 25%;
    position: absolute;
    right: 25%;
    top: 0;
  }
}
</style>
