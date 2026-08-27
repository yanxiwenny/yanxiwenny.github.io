# Design QA — Firefly Star-Mote Pass

- Source visual truth: `/workspace/scratch/fca190e24be5/upload/de41cce4-d9ff-4569-93b7-87ffb8bc7138.png`
- Bouquet implementation: `/workspace/scratch/qa-bouquet-firefly.jpg`
- Cake implementation: `/workspace/scratch/qa-cake-firefly-final.jpg`
- Combined comparison: `/workspace/scratch/qa-particle-comparison.jpg`
- Browser viewport: `1363 × 936` CSS px, device scale factor `1`.
- Tested states: welcome, bouquet, cake and wished.

## Visual comparison

- Orbit removal: passed. The three prominent elliptical trajectory lines are absent from both hero scenes.
- Particle language: passed. The replacement uses small independent pearl-white, champagne-gold, icy-blue and lilac points rather than connected paths.
- Density: passed. Desktop renders 360 hero-local motes plus the ambient star field; mobile renders 210 and reduced-motion renders 96.
- Depth: passed. Motes are split between canvases behind and in front of the bouquet/cake, with distinct opacity and glow ranges.
- Motion: passed. Each mote has its own drift direction, wander radius, phase and twinkle rate, producing a firefly-like asynchronous shimmer rather than orbital travel.
- Accents: passed. Only a small subset briefly forms restrained cross-shaped glints; most particles remain sub-1.2 px points.
- Bouquet: passed. The ivory/lavender subject stays crisp and prominent while nearby motes and falling petals remain clearly separable.
- Cake: passed. The pearl-lavender tiers, lace, crystals and flowers remain legible; the star points support rather than obscure the candle.
- Typography and code credits: passed. Chinese copy remains readable and the slow, translucent code background remains visible.

## Interaction checks

- Welcome → bouquet transition: passed.
- Bouquet → cake transition: passed.
- Layered drag/rotation implementation remains present for bouquet and cake.
- Dynamic candle: passed; flame, glow and embers remain independent of the new particle field.
- Wish action: passed; keyboard activation extinguished the flame, played the burst and revealed `愿望已被星光好好收下。`.
- Music and replay controls remain present and accessible.

## Technical checks

- Production build completed successfully with Vite.
- `dist/` and `docs/` are byte-for-byte synchronized.
- Runtime resources remain relative and local, including `./audio/bgm.mp3`.
- No `drawOrbit` function or canvas ellipse trajectory remains in the source.
- No Three.js import, WebGL renderer, GLB/GLTF model or runtime external HTTP/HTTPS asset was introduced.

## Findings

No actionable P0, P1, P2 or P3 issue remains in the tested flow.

final result: passed
