import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { hasHighlight, normalizeHighlight, sameHighlight } from '../lib/chart/highlight.js'

export const useChartInspectorStore = defineStore('chartInspector', {
  state: () => ({
    hoverHighlight:  null,
    pinnedHighlight: null,
    pinnedHighlights: [],
    lastActiveHighlight: null,
    drawerOpen:      false,
    sourceChart:     null,
  }),
  getters: {
    activeHighlight: state => state.pinnedHighlight || state.hoverHighlight || state.lastActiveHighlight || { bodies: [], aspectKey: '' },
    activeBodies() { return this.activeHighlight.bodies || [] },
    activeAspectKey() { return this.activeHighlight.aspectKey || '' },
    activeHumanDesign() { return this.activeHighlight.hd || null },
    hasSelection() { return hasHighlight(this.activeHighlight) },
    pinnedCount: state => state.pinnedHighlights.length,
    canOpenDrawer() { return this.hasSelection || this.pinnedCount > 0 },
    selectionKind() { return this.activeHumanDesign ? this.activeHumanDesign.type : this.activeAspectKey ? 'aspect' : this.activeBodies.length ? 'planet' : '' },
  },
  actions: {
    receiveHighlightEvent(detail = {}) {
      const highlight = detail.highlight ? normalizeHighlight(detail.highlight) : null
      if (detail.chart) this.sourceChart = markRaw(detail.chart)

      if (detail.pinned) {
        this.pinnedHighlight = hasHighlight(highlight) ? highlight : null
        if (!this.pinnedHighlight) {
          this.pinnedHighlights    = []
          this.lastActiveHighlight = null
          this.drawerOpen          = false
          return
        }
        if (this.pinnedHighlight && !this.pinnedHighlights.some(item => sameHighlight(item, this.pinnedHighlight))) {
          this.pinnedHighlights = [this.pinnedHighlight, ...this.pinnedHighlights].slice(0, 6)
        }
        this.lastActiveHighlight = this.pinnedHighlight
        this.drawerOpen      = Boolean(this.pinnedHighlight)
        return
      }

      this.hoverHighlight = hasHighlight(highlight) ? highlight : null
      if (this.hoverHighlight) this.lastActiveHighlight = this.hoverHighlight
    },
    setHoverHighlight(highlight, chart = null) {
      if (chart) this.sourceChart = markRaw(chart)
      this.hoverHighlight = hasHighlight(highlight) ? normalizeHighlight(highlight) : null
      if (this.hoverHighlight) this.lastActiveHighlight = this.hoverHighlight
    },
    clearHoverHighlight() {
      this.hoverHighlight = null
    },
    setPinnedHighlight(highlight, chart = null) {
      if (chart) this.sourceChart = markRaw(chart)
      this.pinnedHighlight = hasHighlight(highlight) ? normalizeHighlight(highlight) : null
      if (this.pinnedHighlight && !this.pinnedHighlights.some(item => sameHighlight(item, this.pinnedHighlight))) {
        this.pinnedHighlights = [this.pinnedHighlight, ...this.pinnedHighlights].slice(0, 6)
      }
      if (this.pinnedHighlight) this.lastActiveHighlight = this.pinnedHighlight
      this.drawerOpen      = Boolean(this.pinnedHighlight)
    },
    removePinnedHighlight(highlight) {
      this.pinnedHighlights = this.pinnedHighlights.filter(item => !sameHighlight(item, highlight))
      if (this.pinnedHighlight && sameHighlight(this.pinnedHighlight, highlight)) {
        this.pinnedHighlight = this.pinnedHighlights[0] || null
        this.drawerOpen      = Boolean(this.pinnedHighlight)
      }
    },
    clearPinnedHighlights() {
      this.pinnedHighlight  = null
      this.pinnedHighlights = []
      if (!this.hoverHighlight) this.drawerOpen = false
    },
    openDrawer() {
      if (!this.pinnedHighlight && this.pinnedHighlights.length) this.pinnedHighlight = this.pinnedHighlights[0]
      else if (!this.pinnedHighlight && !this.hoverHighlight && this.lastActiveHighlight) this.pinnedHighlight = this.lastActiveHighlight
      if (this.canOpenDrawer) this.drawerOpen = true
    },
    closeDrawer() {
      this.drawerOpen = false
    },
    clearAll() {
      this.hoverHighlight  = null
      this.pinnedHighlight = null
      this.pinnedHighlights = []
      this.lastActiveHighlight = null
      this.drawerOpen      = false
      this.sourceChart     = null
    },
  },
})
