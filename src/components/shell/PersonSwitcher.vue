<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../../stores/people.js'
import { usePersonSwitch } from './usePersonSwitch.js'
import { usePopover } from './usePopover.js'

const SEARCH_THRESHOLD = 6

defineProps({
  person:   { type: Object, default: null },
  activeId: { type: String, default: null },
})

const { t }                             = useI18n()
const people                            = usePeopleStore()
const switchPerson                      = usePersonSwitch()
const { root, trigger, open, hide, toggle } = usePopover()
const query                             = ref('')

const normalize  = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const compact    = (person) => `${person.isoLocal.replace('T', ' ')} · ${person.placeLabel}`
const searchable = computed(() => people.list.length > SEARCH_THRESHOLD)
const options    = computed(() => people.sorted.filter(person => normalize(person.name).includes(normalize(query.value))))

const items = () => [...root.value.querySelectorAll('[role="option"]')]

const focusInitial = () => {
  const target = root.value.querySelector('[data-testid="person-switcher-search"]')
    || root.value.querySelector('[aria-selected="true"]')
    || root.value.querySelector('[role="option"], [data-testid="person-switcher-new"]')
  target?.focus()
}

const move = (step) => {
  const list = items()
  const at   = list.indexOf(document.activeElement)
  list[at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length]?.focus()
}

const select = (person) => {
  switchPerson(person)
  hide()
}

watch(open, (value) => {
  query.value = ''
  if (value) nextTick(focusInitial)
})
</script>

<template lang="pug">
.person-switcher(ref='root')
  button.person-switcher__trigger(
    ref='trigger'
    type='button'
    aria-haspopup='listbox'
    :aria-expanded='open'
    :aria-label='t("shell.switch_person")'
    data-testid='person-switcher'
    @click='toggle'
    @keydown.down.prevent='open = true'
  )
    span.person-switcher__text
      template(v-if='person')
        strong.person-switcher__name(data-testid='context-person') {{ person.name }}
        span.person-switcher__birth(data-testid='context-birth') {{ compact(person) }}
      strong.person-switcher__name(v-else) {{ t('shell.new_chart') }}
    span.person-switcher__caret(aria-hidden='true')
  .person-switcher__panel(
    v-if='open'
    data-testid='person-switcher-panel'
    @keydown.down.prevent='move(1)'
    @keydown.up.prevent='move(-1)'
  )
    input.person-switcher__search(
      v-if='searchable'
      v-model='query'
      type='search'
      :placeholder='t("shell.search_people")'
      :aria-label='t("shell.search_people")'
      data-testid='person-switcher-search'
    )
    ul.person-switcher__list(v-if='people.list.length' role='listbox' :aria-label='t("shell.switch_person")')
      li(v-for='item in options' :key='item.id' role='presentation')
        button.person-switcher__option(
          type='button'
          role='option'
          tabindex='-1'
          :aria-selected='item.id === activeId'
          :class='{ "is-active": item.id === activeId }'
          :data-testid='`person-switcher-option-${item.id}`'
          @click='select(item)'
        )
          strong {{ item.name }}
          small {{ compact(item) }}
      li.person-switcher__empty(v-if='!options.length' role='presentation') {{ t('shell.no_matches') }}
    p.person-switcher__empty(v-else) {{ t('shell.no_charts') }}
    .person-switcher__footer
      RouterLink(:to='{ name: "home", query: { new: 1 } }' data-testid='person-switcher-new' @click='hide(false)') {{ t('shell.new_chart') }}
      RouterLink(v-if='people.list.length' to='/' data-testid='person-switcher-manage' @click='hide(false)') {{ t('shell.manage_charts') }}
</template>

<style scoped>
.person-switcher {
  min-width: 0;
  position: relative;
}

.person-switcher__trigger {
  align-items: center;
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 0.6rem;
  color: var(--app-text-soft);
  display: flex;
  gap: 0.5rem;
  height: 2.25rem;
  max-width: 16rem;
  min-width: 0;
  padding: 0 0.65rem;
  text-align: left;
  transition: background-color 140ms ease;
}

.person-switcher__trigger:hover,
.person-switcher__trigger[aria-expanded="true"] {
  background: var(--app-chip-hover);
}

.person-switcher__text {
  display: grid;
  min-width: 0;
}

.person-switcher__name,
.person-switcher__birth,
.person-switcher__option strong,
.person-switcher__option small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-switcher__name {
  color: var(--app-heading);
  font-size: 0.8125rem;
  line-height: 1.05rem;
}

.person-switcher__birth {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
  line-height: 0.95rem;
}

.person-switcher__caret {
  border-color: currentColor transparent transparent;
  border-style: solid;
  border-width: 0.3rem 0.28rem 0;
  flex: 0 0 auto;
}

.person-switcher__panel {
  background: var(--app-control);
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  box-shadow: var(--app-shadow);
  display: grid;
  gap: 0.4rem;
  left: 0;
  padding: 0.5rem;
  position: absolute;
  top: calc(100% + 0.5rem);
  width: 20rem;
  z-index: 30;
}

.person-switcher__search {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  color: var(--app-heading);
  font-size: 0.8125rem;
  min-width: 0;
  padding: 0.45rem 0.6rem;
}

.person-switcher__list {
  display: grid;
  gap: 0.15rem;
  max-height: min(20rem, 55vh);
  overflow-y: auto;
}

.person-switcher__option {
  border-radius: 0.5rem;
  color: var(--app-text-soft);
  display: grid;
  padding: 0.45rem 0.6rem;
  text-align: left;
  width: 100%;
}

.person-switcher__option strong {
  color: var(--app-heading);
  font-size: 0.8125rem;
}

.person-switcher__option small {
  color: var(--app-text-muted);
  font-size: 0.6875rem;
}

.person-switcher__option:hover,
.person-switcher__option:focus-visible {
  background: var(--app-chip-hover);
}

.person-switcher__option.is-active {
  background: var(--app-chip);
  box-shadow: inset 2px 0 0 var(--app-accent-text);
}

.person-switcher__empty {
  color: var(--app-text-muted);
  font-size: 0.8125rem;
  padding: 0.5rem 0.6rem;
}

.person-switcher__footer {
  border-top: 1px solid var(--app-border-soft);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  justify-content: space-between;
  padding-top: 0.4rem;
}

.person-switcher__footer a {
  border-radius: 0.4rem;
  color: var(--app-accent-text);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.5rem;
}

.person-switcher__footer a:hover,
.person-switcher__footer a:focus-visible {
  background: var(--app-chip-hover);
}

@media (max-width: 52rem) {
  .person-switcher__trigger {
    max-width: 11rem;
  }

  .person-switcher__panel {
    left: 0.75rem;
    position: fixed;
    right: 0.75rem;
    top: 3.5rem;
    width: auto;
  }
}
</style>
