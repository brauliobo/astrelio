import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '../../stores/session.js'
import { hasPersonRouteQuery } from '../../lib/people/routeQuery.js'

// Activates a person and keeps the current page, re-pointing routes that embed the previous person.
export const usePersonSwitch = () => {
  const route   = useRoute()
  const router  = useRouter()
  const session = useSessionStore()

  return (person) => {
    session.setActive(person.id)
    if (route.name === 'person') return router.replace({ name: 'person', params: { id: person.id } })
    if (route.name === 'natal' && hasPersonRouteQuery(route.query)) return router.push('/map/astrology/chart')
  }
}
