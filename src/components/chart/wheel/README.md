# Chart Wheel Components

`ChartWheel.vue` composes these SVG layers. Keep each visual concern isolated here:

- `WheelArc.vue`: reusable ring sectors.
- `ZodiacRing.vue`, `TickRing.vue`, `HouseCusps.vue`, `HouseNumbers.vue`: outer ring, ruler, house geometry, and labels.
- `PlanetLayer.vue`, `AspectLayer.vue`, `AngleMarkers.vue`: map-specific glyphs, exact aspect lines, and axes.
- `ChartMap.vue`: one reusable chart map; stack maps with the `charts` prop.
- `geometry.js`: shared radii, symbols, colors, coordinate math, and map normalization.

Use exact longitudes for geometry. Only stagger labels/glyphs for readability.
