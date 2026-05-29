import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('../src', import.meta.url)
const TEMPLATE_RE = /<template\b([^>]*)>/g

const vueFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return vueFiles(path)
    return entry.isFile() && entry.name.endsWith('.vue') ? [path] : []
  }))
  return files.flat()
}

const files = await vueFiles(ROOT.pathname)
const failures = []

for (const file of files) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(TEMPLATE_RE)) {
    if (!/\blang=(["'])pug\1/.test(match[1])) failures.push(file)
  }
}

if (failures.length) {
  console.error('Vue templates must use <template lang="pug">:')
  for (const file of [...new Set(failures)]) console.error(`- ${file}`)
  process.exit(1)
}
