import { describe, expect, it } from 'vitest'
import { hasLine6, LINE_6_STAGES, LINE_ARCHETYPES, line6Stage, profileFor, PROFILES } from '../../../src/lib/human-design/profiles.js'

const KEYS = ['1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6', '4/1', '5/1', '5/2', '6/2', '6/3']

describe('profiles', () => {
  it('defines exactly the 12 canonical profiles', () => {
    expect(Object.keys(PROFILES).sort()).toEqual([...KEYS].sort())
  })

  it('resolves the 24 non-canonical line pairs to nothing', () => {
    const lines   = [1, 2, 3, 4, 5, 6]
    const invalid = lines.flatMap(p => lines.map(d => [p, d])).filter(([p, d]) => !profileFor(p, d))

    expect(invalid).toHaveLength(36 - 12)
    expect(profileFor(1, 1)).toBeUndefined()
    expect(profileFor(6, 6)).toBeUndefined()
  })

  it('names the line archetypes', () => {
    expect(Object.values(LINE_ARCHETYPES).map(a => a.key)).toEqual(
      ['investigator', 'hermit', 'martyr', 'opportunist', 'heretic', 'role_model'],
    )
    expect(profileFor(1, 3).name).toBe('Investigator / Martyr')
    expect(profileFor(6, 2).name).toBe('Role Model / Hermit')
    expect(profileFor('4', '1').name).toBe('Opportunist / Investigator')
  })

  it('assigns the right, juxtaposition and left angles', () => {
    const angles = angle => KEYS.filter(key => PROFILES[key].angle === angle)

    expect(angles('right_angle')).toEqual(['1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6'])
    expect(angles('juxtaposition')).toEqual(['4/1'])
    expect(angles('left_angle')).toEqual(['5/1', '5/2', '6/2', '6/3'])
    expect(profileFor(6, 2).angleName).toBe('Left Angle')
  })

  it('keeps conscious and unconscious lines on the profile', () => {
    expect(profileFor(6, 2)).toMatchObject({ key: '6/2', id: '6_2', conscious: 6, unconscious: 2 })
  })

  it('follows the line 6 life stages', () => {
    const profile = profileFor(6, 2)

    expect(LINE_6_STAGES.map(stage => stage.id)).toEqual(['trial', 'roof', 'role_model'])
    expect([10, 29.9, 30, 49.9, 50, 80].map(age => line6Stage(profile, age).id)).toEqual(
      ['trial', 'trial', 'roof', 'roof', 'role_model', 'role_model'],
    )
    expect(hasLine6(profileFor(4, 6))).toBe(true)
    expect(line6Stage(profileFor(1, 3), 40)).toBeUndefined()
  })
})
