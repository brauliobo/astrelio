import { onBeforeUnmount, ref, watch } from 'vue'
import { useMediaQuery } from '../../../composables/useMediaQuery.js'

const EASE = t => t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2

/** Follows a target viewBox, easing between values unless the user prefers reduced motion. */
export const useViewBoxTween = (target, duration = 280) => {
  const current = ref([...target.value])
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  let frame     = 0

  const ease = (from, to, start) => (now) => {
    const progress = Math.min((now - start) / duration, 1)
    current.value  = from.map((value, i) => value + (to[i] - value) * EASE(progress))
    if (progress < 1) frame = requestAnimationFrame(ease(from, to, start))
  }

  watch(target, (to) => {
    cancelAnimationFrame(frame)
    if (reduced.value) current.value = [...to]
    else frame = requestAnimationFrame(now => ease([...current.value], to, now)(now))
  })
  onBeforeUnmount(() => cancelAnimationFrame(frame))
  return current
}
