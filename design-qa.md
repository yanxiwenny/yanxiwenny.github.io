# Design QA — Layered 2.5D Birthday Experience

- Source visual truth:
  - `/workspace/scratch/fca190e24be5/upload/c5c6bb352f2d3bfb72ad29aec98be7a6(2).mp4`
  - `/workspace/scratch/fca190e24be5/reference-video-frames/contact-sheet.jpg`
  - `/workspace/scratch/fca190e24be5/reference-video-frames/frame-08.jpg`
- Implementation screenshots:
  - `/workspace/scratch/qa-bouquet-stacked.jpg`
  - `/workspace/scratch/qa-bouquet-dragged.jpg`
  - `/workspace/scratch/qa-cake-dynamic-flame.jpg`
  - `/workspace/scratch/qa-wish-extinguished-final.jpg`
- Combined reference/implementation board:
  - `/workspace/scratch/fca190e24be5/pearl-birthday/qa-reference-implementation-comparison.jpg`
- Browser viewport: `1363 × 936` CSS px, device scale factor `1`.
- Comparison normalization: the 1280 × 720 reference frame and implementation states were center-cropped into equal 640 × 360 panels before side-by-side review.

## Visual comparison

- Composition: passed. The reference's dark cinematic field, luminous central hero, orbit rings, warm flame, and front/back particle depth are retained while the gift flow remains readable.
- Bouquet: passed. The ivory multi-petal flowers, translucent lavender wrapping, champagne bow, deep shadow, upper/front clipping layers, and foreground petals create a visibly dimensional 2.5D subject.
- Cake: passed. The pearl-lavender tiers, lace piping, crescent, crystals, flowers, pearls, candle and pedestal are rendered as a prominent isolated hero with separate depth, top, front and shine layers.
- Typography: passed. Chinese copy uses a clear serif hierarchy, wide spacing, readable contrast and stable left-column alignment.
- Background code: passed. Three scrolling code-credit columns remain visible in cyan, blue and lilac at restrained opacity.
- Motion: passed. Ambient stars, pointer parallax, split front/back orbit rings, orbit beads, falling petals, particle bursts, layered hero parallax and candle embers remain visually coordinated.

## Interaction checks

- Welcome → bouquet transition: passed.
- Bouquet pointer drag: passed; measured CSS rotation reached `4.78deg` with visible independent layer displacement.
- Bouquet keyboard rotation: passed; Arrow-key input marked the stage as interacted and updated its rotation state.
- Bouquet → cake transition: passed.
- Cake pointer drag: passed; measured CSS rotation reached `-4.90deg` with independent top/front/shadow offsets.
- Dynamic candle: passed; the flame is drawn independently, breathes and sways while its glow and embers follow the wick.
- Wish action: passed; the flame and glow disappear, a gold particle burst plays, and the confirmation copy becomes visible.
- Replay: passed; the experience returns to the welcome state and clears interaction state.
- Music toggle: passed; the audio element switches between paused/on and button text updates between `音乐：关` and `音乐：开`.

## Technical checks

- Production build completed successfully with Vite.
- `dist/` was synchronized byte-for-byte into `docs/` for GitHub Pages publishing.
- Runtime assets use relative paths and exist locally, including `./audio/bgm.mp3` and both 2.5D subject images.
- The runtime contains no Three.js import, WebGL renderer, GLB/GLTF model, or external HTTP/HTTPS dependency.
- No page-origin console warning or error was observed. Browser-extension metadata errors were excluded as unrelated to the implementation.
- The responsive mobile layout and reduced-motion branch are present in CSS; desktop interaction was the captured browser QA target.

## Findings

No actionable P0, P1, P2 or P3 issue remains in the tested flow.

final result: passed
