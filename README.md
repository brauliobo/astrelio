# Astrelio

Frontend-only astrology app — natal charts, transits, secondary progressions, solar returns, and synastry. Vue 3 + Pug + Pinia + `astronomy-engine`. Bilingual (pt-BR / en). Deployed to GitHub Pages.

## Stack

- **Vue 3** with Composition API + `<template lang="pug">`
- **Vite 6** + **Tailwind v4**
- **Pinia** with `pinia-plugin-persistedstate` for the local archive
- **astronomy-engine** (MIT) for planet positions
- Custom port for **Placidus / Koch / Porphyry / Regiomontanus / Equal / Whole-Sign** house systems
- Offline city lookup generated from **GeoNames cities1000** coordinates and IANA timezones
- **`@astrodraw/astrochart`** for the SVG wheel
- **three.js** for the WebGL star background
- **vue-i18n** with pt-BR / en JSON locales (pt-BR is source of truth)
- **vue-router** in hash mode (no GH Pages 404 redirects)
- **vite-plugin-pwa** for offline support
- **Vitest** for ephemeris/houses/aspects unit tests
- **Playwright** for end-to-end specs (Chromium + WebKit)

## Quick start

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run test       # Vitest
npm run e2e        # Playwright (auto-builds + serves preview)
npm run build      # production build
GITHUB_PAGES=1 npm run build   # build with /astrelio/ base path
```

## Repository layout

```
src/
  lib/astro/       ephemeris, houses, aspects, progressions, transits, solar return, synastry, zodiac, timezones
  lib/sky/         three.js scene, planet markers
  lib/geo/         offline GeoNames city database + client-side search
  components/      ChartWheel, AspectTable, PlanetList, Biwheel, NatalForm, CitySearch, SkyBackground
  pages/           Home, Natal, Transits, Progressions, SolarReturn, Synastry, Settings
  stores/          people (persisted), settings (persisted), session (memory only)
  i18n/            pt-BR.json (source of truth) + en.json
tests/
  unit/            Vitest specs for the math layer
  e2e/             Playwright specs (one per page + onboarding + i18n)
.github/workflows/ deploy.yml (Pages) + e2e.yml (PR gate)
```

## Storage

- `astrelio_people`   — Pinia, persisted in localStorage. Person records: `{ id, name, isoLocal, ianaZone, tzOffsetMinutes, lat, lon, placeLabel, createdAt }`
- `astrelio_settings` — Pinia, persisted. `{ locale, houseSystem, zodiac, skyEnabled, theme }`
- `astrelio_locale`   — mirrored standalone for first-paint locale detection
- session store        — in-memory only

## Deploy

Push to `main`. The workflow builds with `GITHUB_PAGES=1` so Vite's `base` resolves to `/astrelio/`, then deploys via `actions/deploy-pages@v4`. Repo Settings → Pages → Source = "GitHub Actions".

For a custom domain, drop a `CNAME` file into `public/` and remove the `base` override in `vite.config.js`.

## License

MIT. See [LICENSE](LICENSE).

City names, coordinates, populations, administrative labels, and timezones are generated from [GeoNames](https://www.geonames.org/) data, licensed under Creative Commons Attribution.
