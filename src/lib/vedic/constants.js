export const AYANAMSHA_KEYS = ['lahiri', 'raman', 'krishnamurti', 'fagan_bradley']

export const VEDIC_HOUSE_MODES = ['whole_sign', 'equal', 'bhava']

export const VEDIC_SIGN_LORDS = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
]

export const VEDIC_CLASSICAL_GRAHAS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
]

export const VEDIC_GRAHAS = [...VEDIC_CLASSICAL_GRAHAS, 'NorthNode', 'SouthNode']

export const VEDIC_OWN_SIGNS = {
  Sun:     [4],
  Moon:    [3],
  Mercury: [2, 5],
  Venus:   [1, 6],
  Mars:    [0, 7],
  Jupiter: [8, 11],
  Saturn:  [9, 10],
}

export const VEDIC_EXALTATION_SIGNS = {
  Sun:     0,
  Moon:    1,
  Mercury: 5,
  Venus:   11,
  Mars:    9,
  Jupiter: 3,
  Saturn:  6,
}

// Values are counted inclusively from the graha's sign, as in traditional house notation.
export const VEDIC_GRAHA_ASPECT_HOUSES = {
  Sun:     [7],
  Moon:    [7],
  Mercury: [7],
  Venus:   [7],
  Mars:    [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn:  [3, 7, 10],
}

export const NAKSHATRA_SPAN = 360 / 27
export const PADA_SPAN      = 360 / 108

export const NAKSHATRAS = [
  'ashwini',
  'bharani',
  'krittika',
  'rohini',
  'mrigashira',
  'ardra',
  'punarvasu',
  'pushya',
  'ashlesha',
  'magha',
  'purva_phalguni',
  'uttara_phalguni',
  'hasta',
  'chitra',
  'swati',
  'vishakha',
  'anuradha',
  'jyeshtha',
  'mula',
  'purva_ashadha',
  'uttara_ashadha',
  'shravana',
  'dhanishta',
  'shatabhisha',
  'purva_bhadrapada',
  'uttara_bhadrapada',
  'revati',
]

export const VIMSHOTTARI_SEQUENCE = [
  'ketu',
  'venus',
  'sun',
  'moon',
  'mars',
  'rahu',
  'jupiter',
  'saturn',
  'mercury',
]

export const VIMSHOTTARI_YEARS = {
  ketu:    7,
  venus:   20,
  sun:     6,
  moon:    10,
  mars:    7,
  rahu:    18,
  jupiter: 16,
  saturn:  19,
  mercury: 17,
}

export const VEDIC_BODY_LABELS = {
  Sun:       'Surya',
  Moon:      'Chandra',
  Mercury:   'Budha',
  Venus:     'Shukra',
  Mars:      'Mangala',
  Jupiter:   'Guru',
  Saturn:    'Shani',
  NorthNode: 'Rahu',
  SouthNode: 'Ketu',
  Uranus:    'Uranus',
  Neptune:   'Neptune',
  Pluto:     'Pluto',
}

export const VEDIC_BODY_SYMBOLS = {
  Sun:       'Su',
  Moon:      'Mo',
  Mercury:   'Me',
  Venus:     'Ve',
  Mars:      'Ma',
  Jupiter:   'Ju',
  Saturn:    'Sa',
  NorthNode: 'Ra',
  SouthNode: 'Ke',
  Uranus:    'Ur',
  Neptune:   'Ne',
  Pluto:     'Pl',
}

export const VEDIC_BODY_COLORS = {
  Sun:       'var(--chart-sun-color)',
  Moon:      'var(--chart-ink)',
  Mercury:   'var(--chart-ink)',
  Venus:     'var(--chart-ink)',
  Mars:      'var(--chart-ink)',
  Jupiter:   'var(--chart-ink)',
  Saturn:    'var(--chart-ink)',
  NorthNode: 'var(--chart-overlay-accent)',
  SouthNode: 'var(--chart-overlay-accent)',
  Uranus:    'var(--chart-ink-muted)',
  Neptune:   'var(--chart-ink-muted)',
  Pluto:     'var(--chart-ink-muted)',
}
