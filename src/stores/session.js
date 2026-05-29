import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    activePersonId:    null,
    comparePersonId:   null,
    transitDateMs:     null,
    progressionDateMs: null
  }),
  actions: {
    setActive(id)        { this.activePersonId  = id },
    setCompare(id)       { this.comparePersonId = id },
    setTransitDate(ms)   { this.transitDateMs   = ms },
    setProgressionDate(ms) { this.progressionDateMs = ms }
  }
})
