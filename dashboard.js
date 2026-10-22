// Readings dashboard: opened with #readings on the same page, so it reads the same
// shared database the check-in writes to. Only the page's owner and editors see data.
// Depends on SPECTRUM and RECORD from index.html.
(function dashboard() {
  const root = document.getElementById("dashboard");
  const NS = "http://www.w3.org/2000/svg";
  const HEX = /^#[0-9a-f]{6}$/i;
  let started = false;

  function maybeStart() {
    if (started || document.body.dataset.view !== "readings") return;
    started = true;
    start();
  }
  addEventListener("hashchange", maybeStart);
  maybeStart();

  // ---------- helpers ----------
  const svgEl = (parent, tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    parent.appendChild(node);
    return node;
  };
  const fmtTime = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const fmtDay = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  const colorAtIndex = (idx) => {
    let best = SPECTRUM.samples[0];
    for (const smp of SPECTRUM.samples) if (Math.abs(smp.index - idx) < Math.abs(best.index - idx)) best = smp;
    return best.hex;
  };
  const ago = (iso) => {
    const s = (Date.now() - Date.parse(iso)) / 1000;
    if (!Number.isFinite(s)) return "—";
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    return `${Math.round(s / 86400)} d ago`;
  };

  function shell() {
    root.innerHTML = `
      <div class="dash">
        <header class="dash-head">
          <div>
            <p class="eyebrow">How do you feel today? · anonymous readings</p>
            <h1>Readings</h1>
          </div>
          <div class="dash-actions">
            <a class="btn" href="#">Back to the check-in</a>
            <button type="button" class="btn primary" id="dash-csv">Copy CSV</button>
            <span class="note" id="dash-status" role="status"></span>
          </div>
        </header>
        <p class="dash-gate" id="dash-gate">Loading readings…</p>
        <div id="dash-body" hidden>
          <section class="tiles" aria-label="Summary">
            <div class="tile"><span class="label">Readings</span><span class="value" id="t-count">0</span><span class="hint" id="t-count-hint">—</span></div>
            <div class="tile"><span class="label">Average index</span><span class="value" id="t-avg">—</span><span class="hint">on the 0–100 loop</span></div>
            <div class="tile"><span class="label">Agreement</span><span class="value" id="t-agree">—</span><span class="hint">0 scattered · 1 identical</span></div>
            <div class="tile"><span class="label">Median hold</span><span class="value" id="t-hold">—</span><span class="hint">seconds before letting go</span></div>
            <div class="tile"><span class="label">Latest</span><span class="value" id="t-latest">—</span><span class="hint" id="t-latest-hint">—</span></div>
          </section>

          <section class="card">
            <h2>Spectrum index</h2>
            <p class="sub">Where readings fall on the colour loop. 0 is the starting green and 100 is green again; each bar counts readings in a step of 5.</p>
            <svg class="chart" id="c-hist" viewBox="0 0 1000 290" role="img" aria-label="Histogram of readings by spectrum index"></svg>
          </section>

          <div class="dash-row">
            <section class="card">
              <h2>Colour plane</h2>
              <p class="sub">Each reading on the OKLab a/b plane, with the loop drawn behind. The × is the average; it sits nearer the centre when readings disagree.</p>
              <svg class="chart" id="c-plane" viewBox="-140 -140 280 280" role="img" aria-label="Readings plotted on the OKLab colour plane"></svg>
            </section>
            <section class="card">
              <h2>Over time</h2>
              <p class="sub">Spectrum index of each reading by the time it was recorded.</p>
              <svg class="chart" id="c-time" viewBox="0 0 600 340" role="img" aria-label="Spectrum index of readings over time"></svg>
            </section>
          </div>

          <section class="card">
            <h2>All readings</h2>
            <p class="sub" id="table-note"></p>
            <div class="table-wrap">
              <table>
                <thead><tr>
                  <th>Recorded</th><th class="num">Index</th><th>Colour</th>
                  <th class="num">L</th><th class="num">a</th><th class="num">b</th>
                  <th class="num">Hold (s)</th><th class="num">Loops</th>
                </tr></thead>
                <tbody id="t-rows"></tbody>
              </table>
            </div>
          </section>
        </div>
        <div class="dash-tip" id="dash-tip" hidden></div>
      </div>`;
  }

  // ---------- tooltip: one element, driven by data-tip on any mark ----------
  function wireTooltip() {
    const tip = document.getElementById("dash-tip");
    root.addEventListener("pointermove", (e) => {
      const mark = e.target.closest?.("[data-tip]");
      if (!mark) { tip.hidden = true; return; }
      tip.textContent = mark.getAttribute("data-tip");
      tip.hidden = false;
      const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
      const y = Math.min(e.clientY + 14, innerHeight - tip.offsetHeight - 8);
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    });
    root.addEventListener("pointerleave", () => { tip.hidden = true; });
  }

  // ---------- summary ----------
  function summarise(rows) {
    if (!rows.length) return null;
    const ma = rows.reduce((t, r) => t + r.a, 0) / rows.length;
    const mb = rows.reduce((t, r) => t + r.b, 0) / rows.length;
    const meanChroma = rows.reduce((t, r) => t + Math.hypot(r.a, r.b), 0) / rows.length;
    const holds = rows.map((r) => r.holdMs).filter(Number.isFinite).sort((x, y) => x - y);
    const median = holds.length ? (holds[(holds.length - 1) >> 1] + holds[holds.length >> 1]) / 2 : NaN;
    return {
      ma, mb,
      avgIndex: SPECTRUM.indexForAngle(Math.atan2(mb, ma)),
      agreement: meanChroma > 0 ? Math.hypot(ma, mb) / meanChroma : 0,
      medianHold: median / 1000,
    };
  }

  function drawTiles(rows, sum) {
    const today = new Date().toDateString();
    document.getElementById("t-count").textContent = rows.length;
    document.getElementById("t-count-hint").textContent =
      `${rows.filter((r) => new Date(r.at).toDateString() === today).length} today`;
    const avg = document.getElementById("t-avg");
    if (sum) {
      avg.innerHTML = "";
      avg.append(sum.avgIndex.toFixed(1));
      const chip = document.createElement("i");
      chip.style.setProperty("--chip", colorAtIndex(sum.avgIndex));
      avg.append(chip);
    } else avg.textContent = "—";
    document.getElementById("t-agree").textContent = sum ? sum.agreement.toFixed(2) : "—";
    document.getElementById("t-hold").textContent = sum && Number.isFinite(sum.medianHold) ? sum.medianHold.toFixed(1) : "—";
    document.getElementById("t-latest").textContent = rows.length ? ago(rows[0].at) : "—";
    document.getElementById("t-latest-hint").textContent = rows.length ? fmtTime.format(new Date(rows[0].at)) : "No readings yet";
  }

  // ---------- histogram over the spectrum scale ----------
  function drawHistogram(rows) {
    const svg = document.getElementById("c-hist");
    svg.replaceChildren();
    const X0 = 48, X1 = 990, YT = 16, YB = 196, BINS = 20;
    const x = (idx) => X0 + (idx / 100) * (X1 - X0);
    const counts = new Array(BINS).fill(0);
    for (const r of rows) counts[Math.min(BINS - 1, Math.max(0, Math.floor(r.index / (100 / BINS))))]++;
    const max = Math.max(1, ...counts);
    const step = max <= 4 ? 1 : Math.ceil(max / 4);
    const top = Math.ceil(max / step) * step;
    const y = (n) => YB - (n / top) * (YB - YT);

    for (let n = 0; n <= top; n += step) {
      svgEl(svg, "line", { class: "grid", x1: X0, x2: X1, y1: y(n), y2: y(n) });
      svgEl(svg, "text", { class: "tick-label", x: X0 - 10, y: y(n) + 4, "text-anchor": "end" }).textContent = n;
    }
    const bw = (X1 - X0) / BINS;
    counts.forEach((n, i) => {
      if (!n) return;
      const x0 = X0 + i * bw + 1, w = bw - 2, h = YB - y(n), r = Math.min(4, h, w / 2);
      const lo = i * 5, hi = lo + 5;
      svgEl(svg, "path", {
        d: `M${x0} ${YB}V${YB - h + r}Q${x0} ${YB - h} ${x0 + r} ${YB - h}H${x0 + w - r}Q${x0 + w} ${YB - h} ${x0 + w} ${YB - h + r}V${YB}Z`,
        fill: colorAtIndex(lo + 2.5),
        "data-tip": `Index ${lo}–${hi}\n${n} reading${n === 1 ? "" : "s"}`,
      });
    });

    // The scale itself, drawn by index so its spacing is perceptual.
    const defs = svgEl(svg, "defs");
    const grad = svgEl(defs, "linearGradient", { id: "dash-scale", x1: 0, x2: 1, y1: 0, y2: 0 });
    SPECTRUM.samples.forEach((smp, k) => {
      if (k % 12 && k !== SPECTRUM.samples.length - 1) return;
      svgEl(grad, "stop", { offset: (smp.index / 100).toFixed(4), "stop-color": smp.hex });
    });
    svgEl(svg, "rect", { x: X0, y: YB + 8, width: X1 - X0, height: 18, fill: "url(#dash-scale)" });
    svgEl(svg, "rect", { class: "scale-edge", x: X0, y: YB + 8, width: X1 - X0, height: 18 });
    for (const st of SPECTRUM.stops) {
      svgEl(svg, "rect", { x: x(st.index) - 4, y: YB + 36, width: 8, height: 8, fill: st.hex });
      svgEl(svg, "text", { class: "tick-label", x: x(st.index), y: YB + 60, "text-anchor": "middle" }).textContent = Math.round(st.index);
    }
    if (!rows.length) {
      svgEl(svg, "text", { class: "empty", x: (X0 + X1) / 2, y: (YT + YB) / 2, "text-anchor": "middle" })
        .textContent = "No readings yet. Share the check-in link to start collecting.";
    }
  }

  // ---------- OKLab a/b plane ----------
  function drawPlane(rows, sum) {
    const svg = document.getElementById("c-plane");
    svg.replaceChildren();
    const SCALE = 120 / 0.22;
    const P = (a, b) => [a * SCALE, -b * SCALE];
    svgEl(svg, "line", { class: "axis", x1: -130, y1: 0, x2: 130, y2: 0 });
    svgEl(svg, "line", { class: "axis", x1: 0, y1: -130, x2: 0, y2: 130 });
    for (const [tx, ty, label, anchor] of [[130, -6, "+a", "end"], [-130, -6, "−a", "start"], [6, -122, "+b", "start"], [6, 132, "−b", "start"]]) {
      svgEl(svg, "text", { class: "tick-label", x: tx, y: ty, "text-anchor": anchor }).textContent = label;
    }
    const sm = SPECTRUM.samples;
    for (let k = 0; k < sm.length - 1; k += 3) {
      const [x1, y1] = P(sm[k].lab.a, sm[k].lab.b);
      const [x2, y2] = P(sm[Math.min(k + 3, sm.length - 1)].lab.a, sm[Math.min(k + 3, sm.length - 1)].lab.b);
      svgEl(svg, "line", { x1, y1, x2, y2, stroke: sm[k].hex, "stroke-width": 6, "stroke-linecap": "round", opacity: 0.3 });
    }
    for (const r of rows.slice().reverse()) {
      const [cx, cy] = P(r.a, r.b);
      svgEl(svg, "circle", {
        class: "dot", cx, cy, r: 5, fill: r.hex,
        "data-tip": `Index ${r.index.toFixed(1)}\n${fmtTime.format(new Date(r.at))}`,
      });
    }
    if (sum && rows.length >= 2) {
      const [x, y] = P(sum.ma, sum.mb);
      svgEl(svg, "path", {
        class: "mean", d: `M${x - 7} ${y - 7}L${x + 7} ${y + 7}M${x - 7} ${y + 7}L${x + 7} ${y - 7}`,
        "data-tip": `Average index ${sum.avgIndex.toFixed(1)}\nAgreement ${sum.agreement.toFixed(2)}`,
      });
    }
  }

  // ---------- index over time ----------
  function drawTime(rows) {
    const svg = document.getElementById("c-time");
    svg.replaceChildren();
    const X0 = 56, X1 = 588, YT = 14, YB = 300;
    const y = (idx) => YB - (idx / 100) * (YB - YT);

    // Left legend: the spectrum as a vertical strip, so the y-axis reads as colour too.
    const defs = svgEl(svg, "defs");
    const grad = svgEl(defs, "linearGradient", { id: "dash-vscale", x1: 0, x2: 0, y1: 1, y2: 0 });
    SPECTRUM.samples.forEach((smp, k) => {
      if (k % 12 && k !== SPECTRUM.samples.length - 1) return;
      svgEl(grad, "stop", { offset: (smp.index / 100).toFixed(4), "stop-color": smp.hex });
    });
    svgEl(svg, "rect", { x: X0 - 14, y: YT, width: 8, height: YB - YT, fill: "url(#dash-vscale)" });
    for (const v of [0, 25, 50, 75, 100]) {
      svgEl(svg, "line", { class: "grid", x1: X0, x2: X1, y1: y(v), y2: y(v) });
      svgEl(svg, "text", { class: "tick-label", x: X0 - 20, y: y(v) + 4, "text-anchor": "end" }).textContent = v;
    }
    if (!rows.length) {
      svgEl(svg, "text", { class: "empty", x: (X0 + X1) / 2, y: (YT + YB) / 2, "text-anchor": "middle" }).textContent = "No readings yet.";
      return;
    }
    const times = rows.map((r) => Date.parse(r.at)).filter(Number.isFinite);
    let t0 = Math.min(...times), t1 = Math.max(...times);
    if (t1 - t0 < 3600e3) { const mid = (t0 + t1) / 2; t0 = mid - 1800e3; t1 = mid + 1800e3; }
    const pad = (t1 - t0) * 0.04;
    t0 -= pad; t1 += pad;
    const x = (t) => X0 + ((t - t0) / (t1 - t0)) * (X1 - X0);
    const sameDay = new Date(t0).toDateString() === new Date(t1).toDateString();
    const fmt = sameDay ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }) : fmtDay;
    [0, 0.5, 1].forEach((f, i) => {
      const t = t0 + pad + f * (t1 - t0 - 2 * pad);
      svgEl(svg, "text", { class: "tick-label", x: x(t), y: YB + 24, "text-anchor": ["start", "middle", "end"][i] }).textContent = fmt.format(new Date(t));
    });
    for (const r of rows.slice().reverse()) {
      const t = Date.parse(r.at);
      if (!Number.isFinite(t)) continue;
      svgEl(svg, "circle", {
        class: "dot", cx: x(t), cy: y(r.index), r: 5, fill: r.hex,
        "data-tip": `Index ${r.index.toFixed(1)}\n${fmtTime.format(new Date(t))}\nHeld ${(r.holdMs / 1000).toFixed(1)} s`,
      });
    }
  }

  // ---------- table ----------
  function drawTable(rows) {
    const body = document.getElementById("t-rows");
    body.replaceChildren();
    const shown = rows.slice(0, 200);
    document.getElementById("table-note").textContent = rows.length
      ? `Newest first. Showing ${shown.length} of ${rows.length}. Copy CSV exports every reading.`
      : "Readings will be listed here as they arrive.";
    const sign = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(3);
    for (const r of shown) {
      const tr = document.createElement("tr");
      const cells = [
        [fmtTime.format(new Date(r.at)), ""],
        [r.index.toFixed(1), "num"],
        [r.hex, "mono"],
        [r.L.toFixed(3), "num"],
        [sign(r.a), "num"],
        [sign(r.b), "num"],
        [Number.isFinite(r.holdMs) ? (r.holdMs / 1000).toFixed(1) : "—", "num"],
        [Number.isFinite(r.loops) ? String(r.loops) : "—", "num"],
      ];
      cells.forEach(([text, cls], i) => {
        const td = document.createElement("td");
        if (cls) td.className = cls;
        if (i === 2) {
          const sw = document.createElement("span");
          sw.className = "sw";
          sw.style.setProperty("--c", r.hex);
          td.append(sw);
        }
        td.append(text);
        tr.append(td);
      });
      body.append(tr);
    }
  }

  // ---------- CSV ----------
  function wireCsv(getRows) {
    const btn = document.getElementById("dash-csv");
    const status = document.getElementById("dash-status");
    btn.addEventListener("click", () => {
      const cols = ["at", "index", "position", "hex", "L", "a", "b", "l", "c", "h", "holdMs", "loops", "loopSeconds"];
      const rows = getRows();
      const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => r[c] ?? "").join(","))).join("\n");
      const done = (msg) => { status.textContent = msg; setTimeout(() => (status.textContent = ""), 3000); };
      const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = csv;
        root.querySelector(".dash").append(ta);
        ta.select();
        done("Press Ctrl+C / ⌘C to copy");
        setTimeout(() => ta.remove(), 10000);
      };
      try {
        navigator.clipboard.writeText(csv).then(() => done(`Copied ${rows.length} rows`), fallback);
      } catch (e) { fallback(); }
    });
  }

  // ---------- start ----------
  async function start() {
    shell();
    wireTooltip();
    const gate = document.getElementById("dash-gate");
    const body = document.getElementById("dash-body");
    const showGate = (msg) => { gate.textContent = msg; gate.hidden = false; body.hidden = true; };

    const db = await RECORD.db;
    if (!db) { showGate("Readings appear here when this page is opened on claude.ai while signed in."); return; }
    const user = await (window.claude?.use ? window.claude.use("user").catch(() => null) : null);
    const allowed = user
      ? (await user.isOwner().catch(() => false)) || (await user.canEdit().catch(() => false))
      : false;
    if (!allowed) { showGate("This view is for the page's owner and editors. Use the check-in instead."); return; }

    gate.hidden = true;
    body.hidden = false;
    let rows = [];
    wireCsv(() => rows);

    const valid = (r) => r && Number.isFinite(r.index) && Number.isFinite(r.a) && Number.isFinite(r.b)
      && Number.isFinite(r.L) && typeof r.hex === "string" && HEX.test(r.hex) && typeof r.at === "string";
    const render = () => {
      const sum = summarise(rows);
      drawTiles(rows, sum);
      drawHistogram(rows);
      drawPlane(rows, sum);
      drawTime(rows);
      drawTable(rows);
    };
    render();

    db.collection("readings").orderBy("at", "desc").limit(1000).onSnapshot(
      (snap) => { rows = snap.docs.map((d) => d.data()).filter(valid); render(); },
      () => showGate("The readings could not be loaded. Reload the page to try again.")
    );
  }
})();
