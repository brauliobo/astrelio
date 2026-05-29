import fs from 'node:fs'
import path from 'node:path'
import cities1000 from 'cities1000'

const OUT = path.resolve('public/data/cities.generated.json')
const ADMIN_URL = 'https://download.geonames.org/export/dump/admin1CodesASCII.txt'
const COUNTRY_URL = 'https://download.geonames.org/export/dump/countryInfo.txt'

const BR_ADMIN = {
  '01': 'AC',
  '02': 'AL',
  '03': 'AP',
  '04': 'AM',
  '05': 'BA',
  '06': 'CE',
  '07': 'DF',
  '08': 'ES',
  '11': 'MS',
  '13': 'MA',
  '14': 'MT',
  '15': 'MG',
  '16': 'PA',
  '17': 'PB',
  '18': 'PR',
  '20': 'PI',
  '21': 'RJ',
  '22': 'RN',
  '23': 'RS',
  '24': 'RO',
  '25': 'RR',
  '26': 'SC',
  '27': 'SP',
  '28': 'SE',
  '29': 'GO',
  '30': 'PE',
  '31': 'TO',
}

const strip = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const readRemoteMap = async (url, parse) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`failed to fetch ${url}: ${response.status}`)
  return parse(await response.text())
}

const adminNames = await readRemoteMap(ADMIN_URL, (text) => {
  const map = new Map()
  for (const line of text.trim().split('\n')) {
    const [key, name, ascii] = line.split('\t')
    map.set(key, name || ascii)
  }
  return map
})

const countryNames = await readRemoteMap(COUNTRY_URL, (text) => {
  const map = new Map()
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const parts = line.split('\t')
    map.set(parts[0], parts[4])
  }
  return map
})

const rows = fs.readFileSync(cities1000.file, 'utf8').trim().split('\n')
const seen = new Set()

const cities = rows
  .map((line) => {
    const fields = line.split('\t')
    const name = fields[1]
    const ascii = fields[2]
    const lat = Number(fields[4])
    const lon = Number(fields[5])
    const countryCode = fields[8]
    const adminCode = fields[10]
    const population = Number(fields[14]) || 0
    const timeZone = fields[17]
    const admin = countryCode === 'BR'
      ? BR_ADMIN[adminCode]
      : adminNames.get(`${countryCode}.${adminCode}`) || ''
    const country = countryCode === 'BR'
      ? 'Brasil'
      : countryCode === 'US'
        ? 'USA'
        : countryNames.get(countryCode) || countryCode
    const region = admin && admin !== name ? `, ${admin}` : ''
    const label = `${name}${region} - ${country}`
    const key = `${label}|${lat}|${lon}`

    if (seen.has(key)) return null
    seen.add(key)

    return [
      label,
      Number(lat.toFixed(5)),
      Number(lon.toFixed(5)),
      timeZone,
      population,
      strip(`${name} ${ascii} ${admin} ${country} ${countryCode}`),
    ]
  })
  .filter(Boolean)
  .sort((a, b) => b[4] - a[4] || a[0].localeCompare(b[0]))

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(
  OUT,
  `${JSON.stringify(cities)}\n`,
  'utf8',
)

console.log(`Wrote ${cities.length.toLocaleString('en-US')} cities to ${OUT}`)
