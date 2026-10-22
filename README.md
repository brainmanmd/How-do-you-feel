# How Do You Feel Today

A phone-sized mood check-in. A glowing Halvorsen attractor breathes in light green on a black screen. Pressing and holding cycles it through the colour wheel (green → blue → purple → red → orange → yellow → green, 5 s per loop) and releasing locks in the colour that matches how you feel. The page around the phone uses a minimalist Bauhaus composition.

## Run it

Open `index.html` in a recent browser. It is a single self-contained page; Three.js (r147) and the Jost / DM Mono fonts load from public CDNs.

## Tuning

Every setting lives in the `CONFIG` object at the top of the script in `index.html`: attractor shape and motion, the OKLCH colour stops, pulse rate and depth, and glow.

## Build progress

1. [x] Scaffold: phone frame, Bauhaus page, Three.js scene with bloom
2. [x] Halvorsen attractor point cloud, centred and slowly rotating
3. [x] Idle pulse (12 breaths / min)
4. [ ] Colour engine: 5 s loop through the OKLCH stops
5. [ ] Upward wave with a bright band at the wave front
6. [ ] Press and release interaction, lock and "Try again"
7. [ ] Clockwise timer ring synced to the loop
8. [ ] Tweak panel
9. [ ] Presets (save, load, JSON import and export)
