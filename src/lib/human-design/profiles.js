/** Line archetypes; lines 1-3 form the lower (personal) trigram, 4-6 the upper (transpersonal) one. */
export const LINE_ARCHETYPES = {
  1: { line: 1, key: 'investigator', name: 'Investigator', theme: 'foundation',       trigram: 'lower' },
  2: { line: 2, key: 'hermit',       name: 'Hermit',       theme: 'natural',          trigram: 'lower' },
  3: { line: 3, key: 'martyr',       name: 'Martyr',       theme: 'trial_and_error',  trigram: 'lower' },
  4: { line: 4, key: 'opportunist',  name: 'Opportunist',  theme: 'network',          trigram: 'upper' },
  5: { line: 5, key: 'heretic',      name: 'Heretic',      theme: 'projection_field', trigram: 'upper' },
  6: { line: 6, key: 'role_model',   name: 'Role Model',   theme: 'objectivity',      trigram: 'upper' },
}

export const PROFILE_ANGLES = {
  right_angle:   { key: 'right_angle',   name: 'Right Angle',   destiny: 'personal' },
  juxtaposition: { key: 'juxtaposition', name: 'Juxtaposition', destiny: 'fixed' },
  left_angle:    { key: 'left_angle',    name: 'Left Angle',    destiny: 'transpersonal' },
}

const ANGLE_BY_PROFILE = {
  '1/3': 'right_angle', '1/4': 'right_angle', '2/4': 'right_angle', '2/5': 'right_angle',
  '3/5': 'right_angle', '3/6': 'right_angle', '4/6': 'right_angle',
  '4/1': 'juxtaposition',
  '5/1': 'left_angle', '5/2': 'left_angle', '6/2': 'left_angle', '6/3': 'left_angle',
}

const buildProfile = ([key, angle]) => {
  const [conscious, unconscious] = key.split('/').map(Number)

  return {
    key,
    id:                    key.replace('/', '_'),
    conscious,
    unconscious,
    consciousArchetype:    LINE_ARCHETYPES[conscious].key,
    unconsciousArchetype:  LINE_ARCHETYPES[unconscious].key,
    name:                  `${LINE_ARCHETYPES[conscious].name} / ${LINE_ARCHETYPES[unconscious].name}`,
    angle,
    angleName:             PROFILE_ANGLES[angle].name,
  }
}

/** The 12 canonical profiles keyed 'personality/design' (e.g. '6/2'). */
export const PROFILES = Object.fromEntries(Object.entries(ANGLE_BY_PROFILE).map(entry => [entry[0], buildProfile(entry)]))

/** Profile of the Personality (conscious) and Design (unconscious) Sun lines; undefined for the 24 non-canonical pairs. */
export const profileFor = (personalitySunLine, designSunLine) => PROFILES[`${personalitySunLine}/${designSunLine}`]

/** Phases of a line 6 life; the Saturn return (~29.5y) and Chiron return (~50.7y) mark the two thresholds. */
export const LINE_6_STAGES = [
  { id: 'trial',      fromAge: 0,  toAge: 30,       anchor: null },
  { id: 'roof',       fromAge: 30, toAge: 50,       anchor: 'saturn_return' },
  { id: 'role_model', fromAge: 50, toAge: Infinity, anchor: 'chiron_return' },
]

export const hasLine6 = profile => profile.conscious === 6 || profile.unconscious === 6

/** Line 6 stage for an age in years (30 and 50 open the next stage), undefined when the profile has no line 6. */
export const line6Stage = (profile, ageYears) =>
  hasLine6(profile) ? LINE_6_STAGES.findLast(stage => ageYears >= stage.fromAge) : undefined
