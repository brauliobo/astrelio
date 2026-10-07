<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../../stores/settings.js'
import { usePopover } from './usePopover.js'

const SKY_VIEW_MODES = ['sky', 'planetarium']

const { t, locale }                         = useI18n()
const settings                              = useSettingsStore()
const { root, trigger, open, hide, toggle } = usePopover()

const activeTheme      = computed(() => settings.theme === 'light' ? 'light' : 'dark')
const toggleThemeLabel = computed(() => t(activeTheme.value === 'light' ? 'theme.switch_to_dark' : 'theme.switch_to_light'))

const onLocale = (event) => {
  settings.setLocale(event.target.value)
  locale.value = settings.locale
}
</script>

<template lang="pug">
.preferences-menu(ref='root' data-testid='utility-menu')
  button.preferences-menu__trigger(
    ref='trigger'
    type='button'
    aria-haspopup='true'
    :aria-expanded='open'
    :aria-label='t("shell.utilities")'
    :title='t("shell.utilities")'
    data-testid='utility-menu-summary'
    @click='toggle'
  )
    svg(width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' aria-hidden='true')
      path(d='M3 6h14M3 14h14')
      circle(cx='7' cy='6' r='2' fill='var(--app-control)')
      circle(cx='13' cy='14' r='2' fill='var(--app-control)')
  .preferences-menu__panel(v-if='open' role='group' :aria-label='t("shell.utilities")' data-testid='utility-menu-panel')
    .preferences-menu__row
      span {{ t('shell.sky_background') }}
      .preferences-menu__segmented(:aria-label='t("shell.sky_background")')
        button(
          v-for='mode in SKY_VIEW_MODES'
          :key='mode'
          type='button'
          :class='{ "is-active": settings.skyView === mode }'
          :aria-pressed='settings.skyView === mode'
          :data-testid='`sky-view-${mode}`'
          @click='settings.setSkyView(mode)'
        ) {{ t(`chart.view_modes.${mode}`) }}
    .preferences-menu__row
      span {{ t('settings.language') }}
      select.app-locale-select.h-8.rounded-full.border.text-xs.font-semibold.outline-none.transition(
        class='px-3 pr-8'
        :value='settings.locale'
        :aria-label='t("settings.language")'
        data-testid='locale-select'
        @change='onLocale'
      )
        option(value='pt-BR') {{ t('settings.languages.pt_BR') }}
        option(value='en') {{ t('settings.languages.en') }}
    .preferences-menu__row
      span {{ t('shell.theme') }}
      button.theme-toggle(
        type='button'
        :aria-label='toggleThemeLabel'
        :title='toggleThemeLabel'
        :data-theme='activeTheme'
        data-testid='theme-toggle'
        @click='settings.toggleTheme()'
      )
        span.theme-toggle__icon(aria-hidden='true') {{ activeTheme === 'light' ? '☾' : '☼' }}
    RouterLink.preferences-menu__settings(to='/settings' data-testid='utility-settings' @click='hide(false)') {{ t('nav.settings') }}
</template>

<style scoped>
.preferences-menu {
  flex: 0 0 auto;
  position: relative;
}

.preferences-menu__trigger {
  align-items: center;
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-soft);
  display: flex;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

.preferences-menu__trigger:hover,
.preferences-menu__trigger[aria-expanded="true"] {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.preferences-menu__panel {
  background: var(--app-control);
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  box-shadow: var(--app-shadow);
  display: grid;
  gap: 0.6rem;
  padding: 0.75rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: 17rem;
  z-index: 30;
}

.preferences-menu__row {
  align-items: center;
  color: var(--app-text-soft);
  display: flex;
  font-size: 0.75rem;
  font-weight: 700;
  gap: 0.75rem;
  justify-content: space-between;
}

.preferences-menu__segmented {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  display: inline-flex;
  padding: 0.125rem;
}

.preferences-menu__segmented button {
  border-radius: 0.375rem;
  color: var(--app-text-soft);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  min-height: 1.75rem;
  padding: 0.4rem 0.6rem;
  white-space: nowrap;
}

.preferences-menu__segmented button:hover,
.preferences-menu__segmented button:focus-visible {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.preferences-menu__segmented button.is-active {
  background: rgb(252 211 77);
  color: rgb(15 23 42);
}

.preferences-menu__settings {
  border-top: 1px solid var(--app-border-soft);
  color: var(--app-accent-text);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.6rem 0.25rem 0.1rem;
}

.preferences-menu__settings:hover,
.preferences-menu__settings:focus-visible {
  color: var(--app-hover-text);
}

@media (max-width: 52rem) {
  .preferences-menu__panel {
    position: fixed;
    right: 0.75rem;
    top: 3.5rem;
    width: min(17rem, calc(100vw - 1.5rem));
  }
}
</style>
