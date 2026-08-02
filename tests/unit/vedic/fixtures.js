import { nakshatraOf } from '../../../src/lib/vedic/derivations.js'

const LONGITUDES = {
  Sun:       10,
  Moon:      45,
  Mars:      100,
  Mercury:   250,
  Jupiter:   70,
  Venus:     20,
  Saturn:    190,
  NorthNode: 305,
  SouthNode: 125,
}

export const vedicChartFixture = () => ({
  id:        'vedic-fixture',
  ascendant: 0,
  cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
  positions: Object.entries(LONGITUDES).map(([name, longitude]) => ({
    name,
    longitude,
    signIndex:  Math.floor(longitude / 30),
    nakshatra:  nakshatraOf(longitude),
    retrograde: false,
  })),
  navamsa: Object.entries(LONGITUDES).map(([name, longitude]) => ({
    name,
    longitude,
    navamsaSignIndex: name === 'Sun' ? 0 : (Math.floor(longitude / 30) + 1) % 12,
  })),
  dashas: {
    moonNakshatra: nakshatraOf(LONGITUDES.Moon),
    active: {
      mahadasha:  'sun',
      antardasha: 'venus',
      startJd:    2450000,
      endJd:      2452000,
    },
  },
})
