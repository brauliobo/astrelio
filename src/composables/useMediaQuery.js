import { onBeforeUnmount, ref } from 'vue'

/** Reactive `matchMedia` result for a CSS media query. */
export const useMediaQuery = (query) => {
  const media   = window.matchMedia(query)
  const matches = ref(media.matches)
  const sync    = event => { matches.value = event.matches }

  media.addEventListener('change', sync)
  onBeforeUnmount(() => media.removeEventListener('change', sync))
  return matches
}
