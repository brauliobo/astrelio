import { defineStore } from 'pinia'

let counter = 1
const newId = () => `${Date.now().toString(36)}${(counter++).toString(36)}`

export const usePeopleStore = defineStore('people', {
  state:   () => ({ list: [] }),
  getters: {
    byId:   (s) => (id) => s.list.find(p => p.id === id),
    sorted: (s) => [...s.list].sort((a, b) => b.createdAt - a.createdAt)
  },
  actions: {
    add(person) {
      const rec = { ...person, id: person.id || newId(), createdAt: Date.now() }
      this.list.push(rec)
      return rec
    },
    update(id, patch) {
      const i = this.list.findIndex(p => p.id === id)
      if (i >= 0) this.list[i] = { ...this.list[i], ...patch }
    },
    remove(id) { this.list = this.list.filter(p => p.id !== id) },
    clear()    { this.list = [] }
  },
  persist: { key: 'astrelio_people' }
})
