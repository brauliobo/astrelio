import { buildHumanDesignTransitChart, humanDesignTransitConnection } from './bodygraph.js'

export const buildHumanDesignTransitContext = ({ natalChart, dateMs, lat, lon }) => {
  const transitChart = buildHumanDesignTransitChart(dateMs, lat, lon)

  return {
    transitChart,
    connection: transitChart
      ? humanDesignTransitConnection(natalChart, transitChart, { lat, lon })
      : null,
  }
}
