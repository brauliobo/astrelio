import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_EXTENSIONS  = new Set(['.js', '.mjs', '.ts', '.vue'])
const TEMPLATE_RE        = /<template\b[^>]*\blang=(['"])pug\1[^>]*>([\s\S]*?)<\/template>/gi
const ATTRIBUTE_RE       = /(^|[\s(,])(aria-label|title|placeholder|alt)\s*=\s*(['"])(.*?)\3/g
const BOUND_ATTRIBUTE_RE = /(^|[\s(,])(?::|v-bind:)(aria-label|title|placeholder|alt)\s*=\s*(['"])(['"`])(.*?)\4\3/g
const PLACEHOLDER_RE     = /\{\s*([A-Za-z_][\w.-]*)\s*(?=[,}])/g

export const I18N_LITERAL_ALLOWLIST = {
  brands:              new Set(['Astrelio', 'GeoNames', 'MIT']),
  localeAbbreviations: new Set(['EN', 'PT', 'en', 'pt-BR']),
  technical:           new Set(['Ctrl K', 'E', 'PDF', 'R', 'UTC', 'x', '%', '°', '℞']),
  intentionalDynamic:  [/^\s*$/, /^(?:\s*(?:\{\{[\s\S]*?\}\}|#\{[\s\S]*?\})\s*)+$/],
}

const valueType = value => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const location = (source, index) => source.slice(0, index).split('\n').length

const issue = (rule, file, message, options = {}) => ({
  rule,
  file,
  ...options,
  message,
})

const placeholders = value => new Set([...value.matchAll(PLACEHOLDER_RE)].map(match => match[1]))

const sameSet = (left, right) => left.size === right.size && [...left].every(value => right.has(value))

const sortedValues = values => [...values].sort().join(', ') || '(none)'

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function compareLocales(base, target, options = {}) {
  const baseLocale   = options.baseLocale || 'en'
  const targetLocale = options.targetLocale || 'pt-BR'
  const file         = options.file || 'src/i18n'
  const issues       = []

  const compare = (left, right, path) => {
    const leftType  = valueType(left)
    const rightType = valueType(right)

    if (leftType !== rightType) {
      issues.push(issue('locale-type', file, `${path}: ${baseLocale} is ${leftType}, ${targetLocale} is ${rightType}`, { path }))
      return
    }

    if (leftType === 'object') {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)])
      for (const key of [...keys].sort()) {
        const childPath = path ? `${path}.${key}` : key
        if (!Object.hasOwn(left, key)) {
          issues.push(issue('locale-key', file, `${childPath}: missing from ${baseLocale}`, { path: childPath }))
        } else if (!Object.hasOwn(right, key)) {
          issues.push(issue('locale-key', file, `${childPath}: missing from ${targetLocale}`, { path: childPath }))
        } else {
          compare(left[key], right[key], childPath)
        }
      }
      return
    }

    if (leftType === 'array') {
      if (left.length !== right.length) {
        issues.push(issue('locale-array', file, `${path}: ${baseLocale} has ${left.length} items, ${targetLocale} has ${right.length}`, { path }))
      }
      for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
        compare(left[index], right[index], `${path}[${index}]`)
      }
      return
    }

    if (leftType === 'string') {
      const leftPlaceholders  = placeholders(left)
      const rightPlaceholders = placeholders(right)
      if (!sameSet(leftPlaceholders, rightPlaceholders)) {
        issues.push(issue(
          'locale-placeholder',
          file,
          `${path}: placeholders differ (${baseLocale}: ${sortedValues(leftPlaceholders)}; ${targetLocale}: ${sortedValues(rightPlaceholders)})`,
          { path },
        ))
      }
    }
  }

  compare(base, target, '')
  return issues
}

const getMessage = (messages, key) => {
  let value = messages
  for (const part of key.split('.')) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, part)) return { found: false }
    value = value[part]
  }
  return { found: true, value }
}

const i18nIdentifiers = source => {
  const identifiers = new Map()
  const declaration = /\{([^}]+)\}\s*=\s*useI18n\s*\(/g
  for (const match of source.matchAll(declaration)) {
    for (const entry of match[1].split(',')) {
      const [name, alias] = entry.trim().split(/\s*:\s*/)
      if (['t', 'te', 'tm'].includes(name)) identifiers.set(alias || name, name)
    }
  }
  return identifiers
}

const literalAt = (source, start, quote) => {
  let value = ''
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (character === '\\') {
      value += source[index + 1] || ''
      index += 1
    } else if (character === quote) {
      if (quote === '`' && value.includes('${')) return null
      return { value, end: index + 1 }
    } else {
      value += character
    }
  }
  return null
}

export function scanTranslationCalls(source, messages, file = 'source.vue') {
  const identifiers = i18nIdentifiers(source)
  if (!identifiers.size) return []

  const issues = []
  for (const [identifier, method] of identifiers) {
    const call = new RegExp(String.raw`(?<![\w$.])${escapeRegExp(identifier)}\s*\(\s*(["'\x60])`, 'g')
    for (const match of source.matchAll(call)) {
      const literal = literalAt(source, match.index + match[0].length, match[1])
      if (!literal) continue

      const key    = literal.value
      const result = getMessage(messages, key)
      const line   = location(source, match.index)
      if (!result.found) {
        issues.push(issue('translation-key', file, `${method}('${key}') does not exist in the reference locale`, { line, path: key }))
        continue
      }

      const type = valueType(result.value)
      if (method === 't' && ['array', 'object'].includes(type)) {
        issues.push(issue('translation-type', file, `t('${key}') resolves to ${type}; use tm() for structured messages`, { line, path: key }))
      } else if (method === 'tm' && !['array', 'object'].includes(type)) {
        issues.push(issue('translation-type', file, `tm('${key}') resolves to ${type}; use t() for scalar messages`, { line, path: key }))
      }
    }
  }
  return issues
}

const isAllowedLiteral = value => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  const allowed    = Object.entries(I18N_LITERAL_ALLOWLIST).some(([category, entries]) => {
    if (category === 'intentionalDynamic') return entries.some(pattern => pattern.test(value))
    return entries.has(normalized)
  })
  if (allowed) return true

  const namedEntries = Object.entries(I18N_LITERAL_ALLOWLIST)
    .filter(([category]) => category !== 'intentionalDynamic')
    .flatMap(([, entries]) => [...entries])
  const segments = normalized
    .replace(/(?:\{\{[\s\S]*?\}\}|#\{[\s\S]*?\})/g, '')
    .split(/\s*[·|]\s*/)
    .map(segment => segment.replace(/^[-\s:;,/()]+|[-\s:;,/()]+$/g, ''))
    .filter(Boolean)
  return segments.length > 0 && segments.every(segment => namedEntries.includes(segment))
}

const stripDynamicContent = value => value
  .replace(/\{\{[\s\S]*?\}\}/g, '')
  .replace(/#\{[\s\S]*?\}/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const pugInlineText = line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('-')) return null
  if (trimmed.startsWith('|')) return trimmed.slice(1).trim()
  if (trimmed.startsWith(')')) return trimmed.slice(1).trim()

  const tag = trimmed.match(/^(?:[A-Za-z][\w-]*)?(?:[.#][\w-]+)*\b/)
  if (!tag || !tag[0]) return null
  let remainder = trimmed.slice(tag[0].length).trimStart()
  if (remainder.startsWith('(')) {
    let depth = 0
    let quote = null
    let escaped = false
    let end = -1
    for (let index = 0; index < remainder.length; index += 1) {
      const character = remainder[index]
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (quote) {
        if (character === quote) quote = null
      } else if (character === "'" || character === '"') {
        quote = character
      } else if (character === '(') {
        depth += 1
      } else if (character === ')') {
        depth -= 1
        if (depth === 0) {
          end = index
          break
        }
      }
    }
    if (end < 0) return null
    remainder = remainder.slice(end + 1).trim()
  }
  return remainder || null
}

const pugLineState = (line, initialDepth) => {
  let depth   = initialDepth
  let quote   = null
  let escaped = false
  let text    = initialDepth === 0 ? line : null

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (escaped) {
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (quote) {
      if (character === quote) quote = null
    } else if (character === "'" || character === '"') {
      quote = character
    } else if (character === '(') {
      depth += 1
    } else if (character === ')' && depth > 0) {
      depth -= 1
      if (initialDepth > 0 && depth === 0) text = line.slice(index)
    }
  }

  return { depth, text }
}

export function scanPugTemplates(source, file = 'component.vue') {
  const issues = []
  for (const template of source.matchAll(TEMPLATE_RE)) {
    const body      = template[2]
    const bodyStart = template.index + template[0].indexOf(body)
    const startLine = location(source, bodyStart) - 1
    let attributeDepth = 0

    for (const [index, line] of body.split('\n').entries()) {
      const lineNumber = startLine + index + 1
      for (const match of line.matchAll(ATTRIBUTE_RE)) {
        const value = match[4]
        if (/\p{L}/u.test(value) && !isAllowedLiteral(value)) {
          issues.push(issue('pug-literal-attribute', file, `${match[2]} contains hard-coded user-facing text: "${value}"`, { line: lineNumber }))
        }
      }
      for (const match of line.matchAll(BOUND_ATTRIBUTE_RE)) {
        const value = match[5]
        if (value.includes('${')) continue
        if (/\p{L}/u.test(value) && !isAllowedLiteral(value)) {
          issues.push(issue('pug-literal-attribute', file, `${match[2]} contains hard-coded user-facing text: "${value}"`, { line: lineNumber }))
        }
      }

      const state = pugLineState(line, attributeDepth)
      attributeDepth = state.depth
      const inline = state.text === null ? null : pugInlineText(state.text)
      if (!inline || isAllowedLiteral(inline)) continue
      const literal = stripDynamicContent(inline)
      if (/\p{L}/u.test(literal) && !isAllowedLiteral(literal)) {
        issues.push(issue('pug-literal-text', file, `hard-coded user-facing text: "${literal}"`, { line: lineNumber }))
      }
    }
  }
  return issues
}

const sourceFiles = async directory => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files   = await Promise.all(entries.map(async entry => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && SOURCE_EXTENSIONS.has(extname(path)) ? [path] : []
  }))
  return files.flat()
}

export async function checkProject(root) {
  const localeDirectory = resolve(root, 'src/i18n')
  const sourceDirectory = resolve(root, 'src')
  const enFile          = resolve(localeDirectory, 'en.json')
  const ptBrFile        = resolve(localeDirectory, 'pt-BR.json')
  const [enSource, ptBrSource, files] = await Promise.all([
    readFile(enFile, 'utf8'),
    readFile(ptBrFile, 'utf8'),
    sourceFiles(sourceDirectory),
  ])
  const en   = JSON.parse(enSource)
  const ptBr = JSON.parse(ptBrSource)
  const issues = compareLocales(en, ptBr, { file: 'src/i18n/en.json <-> src/i18n/pt-BR.json' })

  for (const path of files.sort()) {
    const file   = relative(root, path)
    const source = await readFile(path, 'utf8')
    issues.push(...scanTranslationCalls(source, en, file))
    if (extname(path) === '.vue') issues.push(...scanPugTemplates(source, file))
  }

  return issues.sort((left, right) =>
    left.file.localeCompare(right.file) || (left.line || 0) - (right.line || 0) || left.rule.localeCompare(right.rule))
}

const main = async () => {
  const root   = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const issues = await checkProject(root)
  if (!issues.length) {
    console.log('i18n verification passed')
    return
  }

  console.error(`i18n verification failed with ${issues.length} finding(s):`)
  for (const finding of issues) {
    const position = finding.line ? `:${finding.line}` : ''
    console.error(`- ${finding.file}${position} [${finding.rule}] ${finding.message}`)
  }
  process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
