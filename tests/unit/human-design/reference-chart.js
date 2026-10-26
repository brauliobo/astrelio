import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'

export const referencePerson = {
  id:              'ref-person',
  name:            'Bráulio Oliveira',
  isoLocal:        '1986-02-12T18:10',
  ianaZone:        'America/Sao_Paulo',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
  placeLabel:      'São José dos Campos, SP - Brasil',
}

export const referenceChart = () => buildHumanDesignChart(referencePerson)
