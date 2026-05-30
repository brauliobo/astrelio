import { MANDALA_GATE_ORDER } from '../../lib/human-design/constants.js'
import { angleForMandalaIndex, gateStep, polar } from './wheelCore.js'

const trigramLinesTopToBottom = {
  heaven:   [false, false, false],
  earth:    [true, true, true],
  thunder:  [true, true, false],
  water:    [true, false, true],
  mountain: [false, true, true],
  wind:     [false, false, true],
  fire:     [false, true, false],
  lake:     [true, false, false],
}

const kingWenHexagramTrigrams = {
  1:  ['heaven', 'heaven'],
  2:  ['earth', 'earth'],
  3:  ['water', 'thunder'],
  4:  ['mountain', 'water'],
  5:  ['water', 'heaven'],
  6:  ['heaven', 'water'],
  7:  ['earth', 'water'],
  8:  ['water', 'earth'],
  9:  ['wind', 'heaven'],
  10: ['heaven', 'lake'],
  11: ['earth', 'heaven'],
  12: ['heaven', 'earth'],
  13: ['heaven', 'fire'],
  14: ['fire', 'heaven'],
  15: ['earth', 'mountain'],
  16: ['thunder', 'earth'],
  17: ['lake', 'thunder'],
  18: ['mountain', 'wind'],
  19: ['earth', 'lake'],
  20: ['wind', 'earth'],
  21: ['fire', 'thunder'],
  22: ['mountain', 'fire'],
  23: ['mountain', 'earth'],
  24: ['earth', 'thunder'],
  25: ['heaven', 'thunder'],
  26: ['mountain', 'heaven'],
  27: ['mountain', 'thunder'],
  28: ['lake', 'wind'],
  29: ['water', 'water'],
  30: ['fire', 'fire'],
  31: ['lake', 'mountain'],
  32: ['thunder', 'wind'],
  33: ['heaven', 'mountain'],
  34: ['thunder', 'heaven'],
  35: ['fire', 'earth'],
  36: ['earth', 'fire'],
  37: ['wind', 'fire'],
  38: ['fire', 'lake'],
  39: ['water', 'mountain'],
  40: ['thunder', 'water'],
  41: ['mountain', 'lake'],
  42: ['wind', 'thunder'],
  43: ['lake', 'heaven'],
  44: ['heaven', 'wind'],
  45: ['lake', 'earth'],
  46: ['earth', 'wind'],
  47: ['lake', 'water'],
  48: ['water', 'wind'],
  49: ['lake', 'fire'],
  50: ['fire', 'wind'],
  51: ['thunder', 'thunder'],
  52: ['mountain', 'mountain'],
  53: ['wind', 'mountain'],
  54: ['thunder', 'lake'],
  55: ['thunder', 'fire'],
  56: ['fire', 'mountain'],
  57: ['wind', 'wind'],
  58: ['lake', 'lake'],
  59: ['wind', 'water'],
  60: ['water', 'lake'],
  61: ['wind', 'lake'],
  62: ['thunder', 'mountain'],
  63: ['water', 'fire'],
  64: ['fire', 'water'],
}

export const ichingLinesForGate = (gate) => {
  const trigrams = kingWenHexagramTrigrams[Number(gate)] || kingWenHexagramTrigrams[2]
  const [upper, lower] = trigrams
  return [...trigramLinesTopToBottom[upper], ...trigramLinesTopToBottom[lower]]
}

export const ichingSymbolForGate = gate => String.fromCodePoint(0x4DC0 + Number(gate) - 1)

export const ichingRingLayout = ({ gates = MANDALA_GATE_ORDER, radius = 484 } = {}) =>
  gates.map((gate, index) => ({
    gate,
    symbol: ichingSymbolForGate(gate),
    angle:  index * gateStep + gateStep / 2,
    point:  polar(radius, angleForMandalaIndex(index + 0.5)),
  }))
