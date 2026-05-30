const DATA_URL = `${import.meta.env.BASE_URL}data/cities.generated.json`
const LIMIT    = 8

let citiesPromise

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const toCity = (row) => ({
  name:       row[0],
  lat:        row[1],
  lon:        row[2],
  ianaZone:   row[3],
  population: row[4],
})

export const loadCities = async () => {
  if (!citiesPromise) {
    citiesPromise = fetch(DATA_URL).then((response) => {
      if (!response.ok) throw new Error(`Unable to load city database: ${response.status}`)
      return response.json()
    })
  }
  return citiesPromise
}

export const searchCities = async (query, limit = LIMIT) => {
  const cities = await loadCities()
  const q      = normalize(query || '')

  if (q.length < 2) return cities.slice(0, limit).map(toCity)

  return cities
    .reduce((matches, row) => {
      const index = row[5].indexOf(q)
      if (index === -1) return matches
      matches.push({ row, score: index === 0 ? 0 : index < 24 ? 1 : 2 })
      return matches
    }, [])
    .sort((a, b) => a.score - b.score || b.row[4] - a.row[4] || a.row[0].localeCompare(b.row[0]))
    .slice(0, limit)
    .map((match) => toCity(match.row))
}

export const allCities = loadCities
