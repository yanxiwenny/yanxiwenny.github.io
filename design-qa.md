# Birthday V2 design QA

## Scope

- Route: `docs/birthday-v2/`
- Reference state: the existing birthday cake experience at 1363 × 936
- Implementation states checked: welcome, opening, bouquet, drag rotation, lunar transition, cake, wish, music, and replay
- Comparison image: `qa-v2-comparison.jpg`

## Visual review

- P0: none
- P1: none
- P2: none
- Typography remains legible over the enlarged upward-scrolling code because the story copy uses a restrained local veil and stronger cinematic text shadow.
- The pearl-silver moon is a real transparent raster asset rather than a CSS approximation and stays visually subordinate to the bouquet and cake.
- The bouquet and cake retain their detailed 2.5D depth treatment, drag rotation, layered parallax, and object-specific star motes.
- Ambient stars are denser and brighter without orbit trails; small particles receive limited glow to preserve runtime responsiveness.
- Candle flame and halo are visibly larger and warmer, with more embers and no obstruction of the cake decorations.
- The bouquet-to-cake change now uses a timed lunar transition with retreating copy, drifting petals, a moon push-in, and two particle gathers.
- Responsive rules preserve centered content, safe control spacing, and reduced particle counts on narrow displays.

## Functional review

- Start opens the experience and starts audio after user interaction.
- Bouquet and cake respond to pointer drag and keyboard arrows.
- Accepting the bouquet triggers the lunar transition and then reveals the cake.
- Wishing extinguishes the flame and confirms the wish.
- Music and replay controls work throughout the flow.
- JavaScript syntax and all local asset references passed validation.
- Browser console has no site-origin errors after the final reload; remaining extension-origin metadata messages are unrelated to the page.

## Follow-up polish

- P3: on unusually slow phones, the reduced-motion and mobile particle caps intentionally trade some sparkle density for smoother interaction.

final result: passed
