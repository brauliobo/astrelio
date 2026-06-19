import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    activePersonId:      null,
    comparePersonId:     null,
    transitDateMs:       null,
    progressionDateMs:   null,
    solarReturnYear:     null,
    profectionDateMs:    null,
    solarArcDateMs:      null,
    lunarReturnDateMs:   null,
    relationshipModality: 'astrology'
  }),
  actions: {
    setActive(id)             { this.activePersonId       = id },
    setCompare(id)            { this.comparePersonId      = id },
    setTransitDate(ms)        { this.transitDateMs        = ms },
    setProgressionDate(ms)    { this.progressionDateMs    = ms },
    setSolarReturnYear(year)  { this.solarReturnYear      = year },
    setProfectionDate(ms)     { this.profectionDateMs     = ms },
    setSolarArcDate(ms)       { this.solarArcDateMs       = ms },
    setLunarReturnDate(ms)    { this.lunarReturnDateMs    = ms },
    setRelationshipModality(id) { this.relationshipModality = id }
  },
  persist: { key: 'session' }
})
