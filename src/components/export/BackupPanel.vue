<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '../../stores/people.js'
import { useSettingsStore } from '../../stores/settings.js'
import { applyBackup, createBackup, parseBackupJson } from '../../lib/export/backup.js'
import { downloadJson, timestampFilePart } from '../../lib/export/download.js'

const { t, locale } = useI18n()
const people = usePeopleStore()
const settings = useSettingsStore()
const fileInput = ref(null)
const status = ref('')
const statusTone = ref('text-slate-400')

const setStatus = (messageKey, tone = 'text-slate-400') => {
  status.value = t(messageKey)
  statusTone.value = tone
}

const exportBackup = () => {
  const backup = createBackup({ people, settings })
  downloadJson(backup, `astrelio-backup-${timestampFilePart()}.json`)
  setStatus('export.backup.exported')
}

const chooseImportFile = () => {
  fileInput.value?.click()
}

const readFileText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('invalid_json'))
    reader.readAsText(file)
  })

const importBackup = async (event) => {
  const [file] = event.target.files || []
  event.target.value = ''
  if (!file) return
  if (!window.confirm(t('export.backup.import_confirm'))) return

  try {
    const backup = parseBackupJson(await readFileText(file))
    applyBackup({ backup, people, settings })
    locale.value = settings.locale
    setStatus('export.backup.imported')
  } catch (_error) {
    setStatus('export.backup.invalid', 'text-rose-300')
  }
}
</script>

<template lang="pug">
.ui-panel(data-testid='backup-panel')
  h2.text-sm.font-semibold.text-slate-100.mb-3 {{ t('export.backup.title') }}
  .flex.flex-wrap.gap-2
    button.ui-action-primary.px-3.py-2.text-sm(
      type='button'
      @click='exportBackup'
      data-testid='backup-export'
    ) {{ t('export.backup.export_json') }}
    button.rounded.px-3.py-2.text-sm.text-slate-300(
      type='button'
      class='bg-white/5 hover:bg-white/10 hover:text-white'
      @click='chooseImportFile'
      data-testid='backup-import'
    ) {{ t('export.backup.import_json') }}
    input.hidden(
      ref='fileInput'
      type='file'
      accept='application/json,.json'
      @change='importBackup'
      data-testid='backup-file'
    )
  p.mt-3.text-xs(:class='statusTone' data-testid='backup-status' v-if='status') {{ status }}
</template>
