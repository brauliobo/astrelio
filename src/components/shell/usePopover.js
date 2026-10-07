import { onBeforeUnmount, onMounted, ref } from 'vue'

// Popover state shared by shell menus: closes on outside pointer and Escape, returning focus to the trigger on Escape.
export const usePopover = () => {
  const root    = ref(null)
  const trigger = ref(null)
  const open    = ref(false)

  const hide      = (restoreFocus = true) => {
    open.value = false
    if (restoreFocus) trigger.value?.focus()
  }
  const toggle    = () => open.value ? hide() : (open.value = true)
  const onPointer = (event) => open.value && !root.value?.contains(event.target) && hide(false)
  const onKey     = (event) => open.value && event.key === 'Escape' && hide()

  onMounted(() => {
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointer)
    document.removeEventListener('keydown', onKey)
  })

  return { root, trigger, open, hide, toggle }
}
