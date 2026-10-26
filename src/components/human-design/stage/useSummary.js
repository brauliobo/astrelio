import { computed } from 'vue'
import { useHdText } from './useHdText.js'

const TEST_IDS = {
  type:       'hd-type',
  strategy:   'hd-strategy',
  authority:  'hd-authority',
  profile:    'hd-profile',
  definition: 'hd-definition',
  cross:      'hd-cross',
  signature:  'hd-signature',
  notSelf:    'hd-not-self',
}

/** The eight header facts of a chart, in reading order, with the labels the chips and the explanations share. */
export const useSummary = (chart) => {
  const { t, ui, prose, label, key, cross } = useHdText()

  return computed(() => {
    const typeKey   = key('type', chart.value.type)
    const info      = chart.value.profileInfo
    const gates     = chart.value.incarnationCross?.gates || []
    const crossSub  = gates.length ? `${gates[0]}/${gates[1]} · ${gates[2]}/${gates[3]}` : ''

    return [
      { key: 'type',        label: t('human_design.type'),              value: label('type', chart.value.type), typeKey },
      { key: 'strategy',    label: t('human_design.strategy'),          value: prose('types', typeKey, 'strategy') },
      { key: 'authority',   label: t('human_design.authority'),         value: label('authority', chart.value.authority) },
      { key: 'profile',     label: t('human_design.profile'),           value: chart.value.profile, sub: info && prose('profiles', info.id, 'name') },
      { key: 'definition',  label: t('human_design.definition'),        value: label('definition', chart.value.definition) },
      { key: 'cross',       label: t('human_design.incarnation_cross'), value: cross(chart.value.incarnationCross), sub: crossSub },
      { key: 'signature',   label: ui('signature'),                     value: prose('types', typeKey, 'signature') },
      { key: 'notSelf',     label: ui('not_self'),                      value: prose('types', typeKey, 'not_self') },
    ].map(item => ({ ...item, testId: TEST_IDS[item.key] }))
  })
}
