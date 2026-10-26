import { useI18n } from 'vue-i18n'
import {
  humanDesignChannelLabel,
  humanDesignContentKey,
  humanDesignCrossTitleLabel,
  humanDesignGateLabel,
  humanDesignValueKey,
  humanDesignValueLabel,
} from '../../../lib/human-design/labels.js'

/** Translation helpers of the stage: shell strings, content prose and the Human Design vocabulary. */
export const useHdText = () => {
  const { t, locale } = useI18n()

  return {
    t,
    locale,
    ui:      (key, params) => t(`human_design.ui.shell.${key}`, params),
    prose:   (...parts) => t(humanDesignContentKey(...parts)),
    label:   (group, value) => humanDesignValueLabel(t, group, value),
    key:     (group, value) => humanDesignValueKey(group, value),
    gate:    gate => humanDesignGateLabel(t, gate),
    channel: id => humanDesignChannelLabel(t, id),
    cross:   cross => humanDesignCrossTitleLabel(t, cross),
    planet:  planet => t(`planets.${planet}`),
  }
}
