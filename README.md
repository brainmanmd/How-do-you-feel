# How Do You Feel Today

A phone-sized mood check-in. A glowing Halvorsen attractor breathes in light green on a black screen. Pressing and holding cycles it through the colour wheel (green → blue → purple → red → orange → yellow → green, 5 s per loop) and releasing locks in the colour that matches how you feel. The page around the phone uses a minimalist Bauhaus composition.

## Run it

Open `index.html` in a recent browser. It is a single self-contained page; Three.js (r147) and the Jost / DM Mono fonts load from public CDNs.

## Tuning

The slider panel under the phone adjusts brightness, pulse depth and speed, and the ripple's speed, wave count and bend live. "Copy values" copies the current settings as JSON. When a colour locks in, the page fires a `mood:chosen` event with the hex, OKLCH values, hold time and loop count. Every setting lives in the `CONFIG` object at the top of the script in `index.html`: attractor shape and motion, the OKLCH colour stops, pulse rate and depth, and glow.

## Two views

- **Check-in** (`index.html`): the phone, the tuning sliders and a feedback box for testers. Locking in a colour records a reading in the background.
- **Readings dashboard** (`index.html#readings`, built by `dashboard.js` and `dashboard.css`): live summary tiles, a histogram on the spectrum scale, the OKLab a/b plane, index over time, a table of every reading with its OKLab and hex values, Copy CSV, and tester feedback. It reads the same shared database, and only the page's owner and editors can see it.

## Spectrum index and the record

Every colour a person can stop on lies on one closed path through OKLab colour space (green → blue → purple → red → orange → yellow → green). The **Spectrum Index** is the distance travelled along that path, measured perceptually in OKLab and scaled to 0–100: 0 is the starting green and 100 is green again, so 0 and 100 meet. Equal steps in the index look like equal steps in colour. With the current stops, blue sits near 23, purple 36, red 59, orange 74 and yellow 88.

Each reading also keeps its full 3D OKLab point (L, a, b). The (a, b) plane is the 2D view used to plot and average readings: averaging on the plane avoids the 0/100 seam, and the length of the mean vector divided by the mean chroma gives an agreement score from 0 (scattered) to 1 (identical).

When published on claude.ai, each reading is saved as one document in the page's shared `readings` collection: `index`, `position` (0–6 along the stops), `hex`, `L`/`a`/`b`, `l`/`c`/`h`, `holdMs`, `loops`, `loopSeconds` and `at` (timestamp). Feedback notes go to a `feedback` collection (`text`, `at`). No viewer id, name or device id is stored with either. Viewers need Contributor access to the page to record a reading or send feedback.

## Build progress

1. [x] Scaffold: phone frame, Bauhaus page, Three.js scene with bloom
2. [x] Halvorsen attractor point cloud, centred and slowly rotating
3. [x] Idle pulse (12 breaths / min)
4. [x] Colour engine: 5 s loop through the OKLCH stops
5. [x] Upward wave with a bright band at the wave front
6. [x] Press and release interaction, lock and "Try again"
7. [x] Clockwise timer ring synced to the loop
8. [x] Tweak panel (colour wave, light and pulse, ripple)
9. [ ] Presets (save, load, JSON import and export)
