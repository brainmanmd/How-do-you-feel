# How Do You Feel Today

A phone-sized mood check-in. A glowing Halvorsen attractor breathes in light green on a black screen. Pressing and holding cycles it through the colour wheel (green → blue → purple → red → orange → yellow → green, 5 s per loop) and releasing locks in the colour that matches how you feel. The page around the phone uses a minimalist Bauhaus composition.

## Run it

**Public test link (GitHub Pages).** Every push to `main` runs `.github/workflows/pages.yml`, which builds a standalone copy with `scripts/build-pages.sh` and deploys it. The hosted copy has no shared database yet, so readings are not saved there. One-time setup: repo Settings → Pages → Build and deployment → Source: **GitHub Actions**. The site appears at `https://brainmanmd.github.io/How-do-you-feel/`.

**claude.ai Artifact.** `index.html` is written for claude.ai Artifacts, where readings are saved anonymously.

**Locally.** Run `bash scripts/build-pages.sh` and open `_site/index.html`, or open `index.html` directly.

The page needs no build tools: Three.js (r147) and the Jost, Josefin Sans and DM Mono fonts load from public CDNs.

## Tuning

The slider panel under the phone adjusts brightness, pulse depth and speed, and the ripple's speed, wave count and bend live. "Copy values" copies the current settings as JSON. When a colour locks in, the page fires a `mood:chosen` event with the hex, OKLCH values, hold time and loop count. Every setting lives in the `CONFIG` object at the top of the script in `index.html`: attractor shape and motion, the OKLCH colour stops, pulse rate and depth, and glow.

## Two views

- **Check-in** (`index.html`): the phone and the tuning sliders. Locking in a colour records a reading in the background.
- **Readings dashboard** (`index.html#readings`, built by `dashboard.js` and `dashboard.css`): live summary tiles, a histogram on the spectrum scale, the OKLab a/b plane, index over time, a table of every reading with its OKLab and hex values, and Copy CSV. It reads the same shared database, and only the page's owner and editors can see it.

## Spectrum index and the record

Every colour a person can stop on lies on one closed path through OKLab colour space (green → blue → purple → red → orange → yellow → green). The **Spectrum Index** is the distance travelled along that path, measured perceptually in OKLab and scaled to 0–100: 0 is the starting green and 100 is green again, so 0 and 100 meet. Equal steps in the index look like equal steps in colour. With the current stops, blue sits near 23, purple 36, red 59, orange 74 and yellow 88.

Each reading also keeps its full 3D OKLab point (L, a, b). The (a, b) plane is the 2D view used to plot and average readings: averaging on the plane avoids the 0/100 seam, and the length of the mean vector divided by the mean chroma gives an agreement score from 0 (scattered) to 1 (identical).

When published on claude.ai, each reading is saved as one document in the page's shared `readings` collection: `index`, `position` (0–6 along the stops), `hex`, `L`/`a`/`b`, `l`/`c`/`h`, `holdMs`, `loops`, `loopSeconds` and `at` (timestamp). No viewer id, name or device id is stored. Viewers need Contributor access to the page to record a reading.

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
