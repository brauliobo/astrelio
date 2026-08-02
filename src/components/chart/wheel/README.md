# Chart Wheel Components

`Wheel.vue` composes these SVG layers. Keep each visual concern isolated here:

- `Arc.vue`: reusable ring sectors.
- `ZodiacRing.vue`, `TickRing.vue`, `HouseCusps.vue`, `HouseNumbers.vue`: outer ring, ruler, house geometry, and labels.
- `PlanetLayer.vue`, `AspectLayer.vue`, `AngleMarkers.vue`: map-specific glyphs, exact aspect lines, and axes.
- `ChartMap.vue`: one reusable chart map; stack maps with the `charts` prop.
- `geometry.js`: shared radii, symbols, colors, coordinate math, and map normalization.
- `src/lib/chart/radialSpacing.js`: shared even radial distribution for crowded glyphs across wheel types.

Use exact longitudes for geometry. Crowded glyphs stay on their exact rays; reserve their visual footprints before dividing the remaining radial space into equal border and inter-glyph gaps.
Both wheel orchestrators expose the shared `planetAlignment` contract: `centered` divides visible gaps, while `outer` keeps the first item on the outer orbit and stacks collisions inward. Astrology defaults to `centered`; Human Design defaults to `outer`.
