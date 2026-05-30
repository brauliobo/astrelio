@/home/braulio/.codex/RTK.md

## Vue Templates

- Use Pug for every Vue template: `<template lang="pug">`.
- When adding or refactoring Vue components, do not introduce plain HTML templates.

## Chart Wheel

- Keep chart rendering modular under `src/components/chart/wheel/`.
- See `src/components/chart/wheel/README.md` for the layer responsibilities.
- `Wheel.vue` is only the orchestrator; put SVG parts such as arcs, ticks, houses, planets, aspects, and angles in focused child components.
- Preserve exact astrology geometry for cusps, planet longitudes, and aspect endpoints; offset glyph labels only for readability.
- Keep interaction centered on the wheel: zoom, selection, highlight, and summary should stay compact and stable inside the chart surface.

## Verification

- Prefer targeted checks for focused UI changes. For chart or Human Design visual tweaks, run the affected unit specs and screenshot checks first.
- Avoid full `npm run lint` unless the change spans many files, touches shared syntax/config, or the user asks for a full lint pass; use focused tests for specific changed files instead.
- GitHub Actions uses `npm ci`; when `package.json` dependencies change, update `package-lock.json` in the same change.
- If dependency installation changes while a Vite dev server is running, restart the dev server before debugging browser overlay errors.

## Static GitHub Pages

- Do not commit generated `dist/` output. `dist/` is a local build directory and remains ignored.
- When the user explicitly asks for committed static GitHub Pages output, build and commit `docs/` instead of `dist/`.
- For the repository workflow, keep GitHub Actions Pages deployment as the default unless the user explicitly asks for a committed static artifact.

## UX Structure

- Keep the top navigation condensed to primary workspaces, not individual techniques.
- Use `TimingPage.vue` as the shared workspace for transits, progressions, solar return, profections, solar arc, and lunar return.
- Preserve legacy technique routes as deep links into the timing workspace.
- Prefer presets and disclosure sections over always-visible advanced controls.
- Keep the persistent chart context bar concise: active chart, birth data, system, and preset only.

## Modalities

- Use `src/lib/modalities/` as the generic adapter boundary for chart, interpretation, and connection workflows.
- Keep modality-specific engines isolated under their own domain folders, such as `src/lib/human-design/`.
- UI pages should delegate through modality adapters when switching between astrology, Human Design, or future systems.
- Keep ignored research checkouts under `research/`; never import them as runtime dependencies.

## Git

- Never commit changes unless the user explicitly asks for a commit.
- A prior commit request applies only to that immediate commit. Do not make follow-up commits from the same request; ask or wait for a new explicit commit request.
- When committing multiple logical changes, prefer separate focused commits instead of bundling unrelated work into one commit.
- Use Linux-style commit subjects with a concrete context prefix, and an optional subcontext when it adds clarity: `context: subcontext: describe change`. Example: `pos: send: fix NoxPay amount currency`.
- The commit subject context must never be the generic word `project` or the app/repo/product name itself; use the changed module, domain, or feature area instead.
