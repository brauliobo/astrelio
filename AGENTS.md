@/home/braulio/.codex/RTK.md

## Vue Templates

- Use Pug for every Vue template: `<template lang="pug">`.
- When adding or refactoring Vue components, do not introduce plain HTML templates.

## Chart Wheel

- Keep chart rendering modular under `src/components/chart/wheel/`.
- See `src/components/chart/wheel/README.md` for the layer responsibilities.
- `ChartWheel.vue` is only the orchestrator; put SVG parts such as arcs, ticks, houses, planets, aspects, and angles in focused child components.
- Preserve exact astrology geometry for cusps, planet longitudes, and aspect endpoints; offset glyph labels only for readability.

## Git

- Never commit changes unless the user explicitly asks for a commit.
- A prior commit request applies only to that immediate commit. Do not make follow-up commits from the same request; ask or wait for a new explicit commit request.
- When committing multiple logical changes, prefer separate focused commits instead of bundling unrelated work into one commit.
- Use Linux-style commit subjects with a concrete context prefix, and an optional subcontext when it adds clarity: `context: subcontext: describe change`. Example: `pos: send: fix NoxPay amount currency`.
- The commit subject context must never be the generic word `project` or the app/repo/product name itself; use the changed module, domain, or feature area instead.
