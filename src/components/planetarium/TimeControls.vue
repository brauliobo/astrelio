<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { DAY_MS, RATE_KEYS } from '../../lib/planetarium/time.js'

const props = defineProps({
  timeMs:    { type: Number, required: true },
  playing:   { type: Boolean, default: false },
  rate:      { type: String, default: 'day' },
  direction: { type: Number, default: 1 },
})
const emit = defineEmits(['update:time', 'toggle-play', 'update:rate', 'reverse', 'now'])
const { t } = useI18n()

const isoValue = computed(() => DateTime.fromMillis(props.timeMs).toUTC().toFormat("yyyy-LL-dd'T'HH:mm"))
const stamp    = computed(() => DateTime.fromMillis(props.timeMs).toUTC().toFormat('yyyy-LL-dd HH:mm'))

const onDate = (event) => {
  const parsed = DateTime.fromISO(event.target.value, { zone: 'utc' })
  if (parsed.isValid) emit('update:time', parsed.toMillis())
}

const step = days => emit('update:time', props.timeMs + days * DAY_MS)
</script>

<template lang="pug">
.planetarium-time(data-testid='planetarium-time-controls')
  .planetarium-time__transport
    button.planetarium-time__button(type='button' :title='t("planetarium.time.step_back")' data-testid='planetarium-step-back' @click='step(-1)')
      span(aria-hidden='true') ◀◀
      span.sr-only {{ t('planetarium.time.step_back') }}
    button.planetarium-time__button.is-primary(
      type='button'
      :aria-pressed='playing'
      :title='t(playing ? "planetarium.time.pause" : "planetarium.time.play")'
      data-testid='planetarium-play'
      @click='emit("toggle-play")'
    )
      span(aria-hidden='true') {{ playing ? '❚❚' : '▶' }}
      span.sr-only {{ t(playing ? 'planetarium.time.pause' : 'planetarium.time.play') }}
    button.planetarium-time__button(type='button' :title='t("planetarium.time.step_forward")' data-testid='planetarium-step-forward' @click='step(1)')
      span(aria-hidden='true') ▶▶
      span.sr-only {{ t('planetarium.time.step_forward') }}
    button.planetarium-time__button(
      type='button'
      :aria-pressed='direction < 0'
      :title='t("planetarium.time.reverse")'
      data-testid='planetarium-reverse'
      @click='emit("reverse")'
    )
      span(aria-hidden='true') {{ direction < 0 ? '↺' : '↻' }}
      span.sr-only {{ t('planetarium.time.reverse') }}

  label.planetarium-time__rate
    span.sr-only {{ t('planetarium.time.rate') }}
    select.planetarium-time__select(
      :value='rate'
      :aria-label='t("planetarium.time.rate")'
      data-testid='planetarium-rate'
      @change='emit("update:rate", $event.target.value)'
    )
      option(v-for='key in RATE_KEYS' :key='key' :value='key') {{ t(`planetarium.time.rates.${key}`) }}

  input.planetarium-time__date(
    type='datetime-local'
    :value='isoValue'
    :aria-label='t("planetarium.time.instant")'
    data-testid='planetarium-date'
    @change='onDate'
  )

  span.planetarium-time__stamp(data-testid='planetarium-stamp') {{ stamp }} {{ t('planetarium.time.utc') }}

  button.planetarium-time__button(type='button' data-testid='planetarium-now' @click='emit("now")') {{ t('planetarium.time.now') }}
</template>

<style scoped>
.planetarium-time {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.planetarium-time__transport {
  display: flex;
  gap: 0.25rem;
}

.planetarium-time__button {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-soft);
  font-size: 0.7rem;
  font-weight: 700;
  min-height: 2rem;
  padding: 0.3rem 0.7rem;
  transition: background-color 140ms ease, color 140ms ease;
}

.planetarium-time__button:hover {
  background: var(--app-chip-hover);
  color: var(--app-hover-text);
}

.planetarium-time__button.is-primary[aria-pressed='true'] {
  background: rgb(252 211 77);
  color: rgb(15 23 42);
}

.planetarium-time__select,
.planetarium-time__date {
  background: var(--app-chip);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-soft);
  font-size: 0.7rem;
  min-height: 2rem;
  padding: 0.3rem 0.7rem;
}

.planetarium-time__stamp {
  color: var(--app-text-muted);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}
</style>
