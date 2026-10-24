(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = window.SYSTEMS || [];
  const G = window.GRAPHS || {};
  const C = window.CONFIG || {};
  const hasGsap = !!window.gsap && !reduce;
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, "0");

  $("#yr").textContent = new Date().getFullYear();

  /* ── IST clock ── */
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  const tick = () => ($("#clock").textContent = "IST " + fmt.format(new Date()));
  tick(); setInterval(tick, 15000);

  /* ── cursor spotlight + nav border ── */
  addEventListener("pointermove", (e) => {
    document.documentElement.style.setProperty("--mx", e.clientX + "px");
    document.documentElement.style.setProperty("--my", e.clientY + "px");
  }, { passive: true });
  const nav = $(".nav");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 10), { passive: true });

  /* ════════════ WORKFLOW CANVAS ENGINE ════════════ */
  const NW = 204, NH = 66, VH = 460;
  let uid = 0;

  function createCanvas(svg, term, idleText) {
    const pid = "c" + uid++;
    let graph = null, nodes = [], edges = [], N = {}, W = 1200;
    let token = 0, running = false, drag = null;
    const listeners = new Set();
    const setRunning = (v) => { running = v; listeners.forEach((f) => f(v)); };

    const pathD = (a, b) => {
      const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2;
      const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
      return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    };
    const drawEdges = () => edges.forEach((e) => {
      e.el.setAttribute("d", pathD(N[e.a], N[e.b]));
      if (e.t) {
        const L = e.el.getTotalLength(), p = e.el.getPointAtLength(L * 0.5);
        e.t.setAttribute("x", p.x); e.t.setAttribute("y", p.y - 9);
      }
    });
    const idle = () => { term.innerHTML = `<div class="t-line t-dim">// ${esc(idleText)}</div>`; };

    function load(g) {
      token++; setRunning(false);
      graph = g;
      nodes = g.nodes.map((n) => ({ ...n }));
      N = Object.fromEntries(nodes.map((n) => [n.id, n]));
      W = Math.max(...nodes.map((n) => n.x)) + NW + 30;
      svg.setAttribute("viewBox", `0 0 ${W} ${VH}`);
      svg.innerHTML = "";
      const defs = svgEl("defs", {}, svg);
      const pat = svgEl("pattern", { id: pid + "g", width: 24, height: 24, patternUnits: "userSpaceOnUse" }, defs);
      svgEl("circle", { cx: 1, cy: 1, r: 1, fill: "var(--grid)" }, pat);
      const f = svgEl("filter", { id: pid + "f", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
      svgEl("feGaussianBlur", { stdDeviation: 4, result: "b" }, f);
      const m = svgEl("feMerge", {}, f); svgEl("feMergeNode", { in: "b" }, m); svgEl("feMergeNode", { in: "SourceGraphic" }, m);
      svgEl("rect", { width: W, height: VH, fill: `url(#${pid}g)` }, svg);
      const gE = svgEl("g", {}, svg), gP = svgEl("g", {}, svg), gN = svgEl("g", {}, svg);
      svg._gP = gP; svg._gN = gN;

      const hasIn = new Set(g.edges.map((e) => e.b)), hasOut = new Set(g.edges.map((e) => e.a));
      edges = g.edges.map((e) => {
        const o = { ...e, el: svgEl("path", { class: "edge" + (e.off ? " off" : "") }, gE) };
        if (e.label) { o.t = svgEl("text", { class: "edge-label", "text-anchor": "middle" }, gE); o.t.textContent = e.label; }
        return o;
      });
      nodes.forEach((n) => {
        const gr = svgEl("g", { class: "node", tabindex: "0", role: "img", "aria-label": `${n.lbl}: ${n.sub}` }, gN);
        svgEl("rect", { class: "body", width: NW, height: NH, rx: 12 }, gr);
        svgEl("rect", { class: "ico", x: 12, y: 13, width: 40, height: 40, rx: 9 }, gr);
        svgEl("text", { class: "ico-t", x: 32, y: 38, "text-anchor": "middle" }, gr).textContent = n.ico;
        svgEl("text", { class: "lbl", x: 64, y: 30 }, gr).textContent = n.lbl;
        svgEl("text", { class: "sub", x: 64, y: 48 }, gr).textContent = n.sub;
        svgEl("circle", { class: "status", cx: NW - 14, cy: 14, r: 4, fill: "var(--ok)" }, gr);
        if (hasIn.has(n.id)) svgEl("circle", { class: "port", cx: 0, cy: NH / 2, r: 5 }, gr);
        if (hasOut.has(n.id)) svgEl("circle", { class: "port", cx: NW, cy: NH / 2, r: 5 }, gr);
        gr.setAttribute("transform", `translate(${n.x},${n.y})`);
        gr.addEventListener("pointerdown", (e) => {
          const p = toSvg(e);
          drag = { n, dx: p.x - n.x, dy: p.y - n.y };
          gr.classList.add("dragging"); gN.appendChild(gr);
          svg.setPointerCapture(e.pointerId);
        });
        n.g = gr;
      });
      svg.setAttribute("aria-label", "Interactive workflow diagram: " + nodes.map((n) => n.lbl).join(", "));
      drawEdges();
      idle();
      if (hasGsap) gsap.from(gN.children, { opacity: 0, duration: .5, stagger: .04, ease: "power2.out" });
    }

    const toSvg = (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = toSvg(e);
      drag.n.x = Math.max(0, Math.min(W - NW, p.x - drag.dx));
      drag.n.y = Math.max(0, Math.min(VH - NH, p.y - drag.dy));
      drag.n.g.setAttribute("transform", `translate(${drag.n.x},${drag.n.y})`);
      drawEdges();
    });
    const endDrag = () => { if (drag) drag.n.g.classList.remove("dragging"); drag = null; };
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);

    const log = (html, cls = "") => {
      const d = document.createElement("div");
      d.className = "t-line " + cls; d.innerHTML = html;
      term.appendChild(d);
      while (term.children.length > 6) term.firstChild.remove();
    };
    const ts = () => { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad2).join(":"); };
    const mark = (id, state) => { const g = N[id].g; g.classList.remove("active", "done"); state && g.classList.add(state); };
    const sendPacket = (e, ms = 650) => new Promise((res) => {
      e.el.classList.add("lit");
      if (reduce) { setTimeout(res, 100); return; }
      const c = svgEl("circle", { class: "packet", r: 5, filter: `url(#${pid}f)` }, svg._gP);
      const L = e.el.getTotalLength(); let t0 = null;
      const step = (t) => {
        t0 ??= t; const k = Math.min(1, (t - t0) / ms);
        const p = e.el.getPointAtLength(L * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
        c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
        k < 1 ? requestAnimationFrame(step) : (c.remove(), res());
      };
      requestAnimationFrame(step);
    });

    async function run() {
      if (running || !graph) return;
      const my = ++token; setRunning(true);
      const alive = () => my === token;
      nodes.forEach((n) => mark(n.id)); edges.forEach((e) => e.el.classList.remove("lit"));
      term.innerHTML = "";
      log(`<span class="t-dim">$</span> n8n execute --workflow ${esc(graph.file)}`, "t-dim");
      for (const st of graph.steps) {
        if (!alive()) return;
        const L = (l) => log(`<span class="t-dim">${ts()}</span>  <span class="t-acc">${l[0]}</span>  ${l[1]}`, l[2] || "");
        if (st.start) {
          const ids = [].concat(st.start);
          ids.forEach((id) => mark(id, "active"));
          await wait(320); if (!alive()) return;
          st.log.forEach(L); ids.forEach((id) => mark(id, "done"));
        } else {
          const es = st.go.map((k) => { const [a, b] = k.split(">"); return edges.find((e) => e.a === a && e.b === b); }).filter(Boolean);
          es.forEach((e) => mark(e.b, "active"));
          await Promise.all(es.map((e) => sendPacket(e))); if (!alive()) return;
          st.log.forEach(L); es.forEach((e) => mark(e.b, "done"));
          await wait(120);
        }
      }
      if (!alive()) return;
      log(`<span class="t-ok">✓ execution finished</span> <span class="t-dim">· ${graph.steps.length} steps</span>`);
      setRunning(false);
    }
    return { load, run, onRunning: (f) => listeners.add(f) };
  }

  /* ── home canvas ── */
  const hero = createCanvas($("#flow"), $("#terminal"), 'press "Execute workflow" to replay how this engine runs');
  hero.load(G.orm);
  const runHero = $("#runHero");
  hero.onRunning((v) => (runHero.disabled = v));
  runHero.addEventListener("click", () => hero.run());

  /* ════════════ SYSTEMS EXPLORER ════════════ */
  const ex = createCanvas($("#exFlow"), $("#exTerm"), "press Execute to replay this workflow");
  const exRun = $("#exRun");
  ex.onRunning((v) => (exRun.disabled = v));
  exRun.addEventListener("click", () => ex.run());
  let cur = -1;

  $("#exList").innerHTML = S.map((s, i) => `
    <li data-cat="${s.cat}"><button class="ex-item" data-i="${i}">
      <span class="num">${pad2(i + 1)}</span><span class="t">${esc(s.title)}</span><span class="k">${esc(s.kicker)}</span>
    </button></li>`).join("");
  $$(".ex-item").forEach((b) => b.addEventListener("click", () => { location.hash = "#/systems/" + S[+b.dataset.i].id; }));

  function selectSystem(i, autorun = true) {
    if (i === cur) { return; }
    cur = i;
    const s = S[i];
    $$(".ex-item").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
    const on = $(`.ex-item[data-i="${i}"]`);
    const list = $("#exList");
    if (on && list.scrollWidth > list.clientWidth) list.scrollTo({ left: on.parentElement.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" });
    $("#exFile").textContent = G[s.id] ? G[s.id].file : "workflow.json";
    if (G[s.id]) ex.load(G[s.id]);
    const prev = (i - 1 + S.length) % S.length, next = (i + 1) % S.length;
    const d = $("#exDetail");
    d.innerHTML = `
      <div class="ex-head">
        <div><span class="tag mono">${pad2(i + 1)} · ${esc(s.kicker)}</span><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p></div>
        <div class="ex-stat"><b>${esc(s.stat[0])}</b><span class="mono">${esc(s.stat[1])}</span></div>
      </div>
      <div class="d-col">
        <div class="d-sec"><h4>The problem</h4><p>${esc(s.problem)}</p></div>
        <div class="d-sec"><h4>What I built</h4><ul>${s.built.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
      </div>
      <div class="d-col">
        <div class="d-sec d-hard"><h4>The hard part</h4><p>${esc(s.hard)}</p></div>
        <div class="d-sec"><h4>Stack</h4><div class="d-stack">${s.stack.map((t) => `<span>${esc(t)}</span>`).join("")}</div></div>
      </div>
      <div class="ex-nav mono">
        <button data-go="${prev}">← ${esc(S[prev].title)}</button>
        <button data-go="${next}">${esc(S[next].title)} →</button>
      </div>`;
    d.classList.remove("fade-swap"); void d.offsetWidth; d.classList.add("fade-swap");
    $$("[data-go]", d).forEach((b) => b.addEventListener("click", () => { location.hash = "#/systems/" + S[+b.dataset.go].id; }));
    if (autorun) setTimeout(() => cur === i && ex.run(), 650);
  }

  $$("#filters .chip").forEach((b) => b.addEventListener("click", () => {
    $$("#filters .chip").forEach((x) => x.classList.toggle("is-on", x === b));
    const f = b.dataset.f;
    $$("#exList li").forEach((li) => li.classList.toggle("hide", !(f === "all" || li.dataset.cat === f)));
    const first = $("#exList li:not(.hide) .ex-item");
    if (first && !$("#exList li:not(.hide) .ex-item.on")) location.hash = "#/systems/" + S[+first.dataset.i].id;
  }));

  /* ════════════ STACK · MARQUEE · CONTACT ════════════ */
  $("#stackList").innerHTML = (window.STACK || []).map((g) =>
    `<div class="stack-group"><h4>${esc(g.group)}</h4><ul>${g.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join("");
  const mq = ["webhook → agent → human handoff", "schedule → scrape → judge → enrich", "reply → classify → counter-offer", "post → classify → comment draft", "feed → byline → verify → pitch", "error → alert → fix"];
  $("#marquee").innerHTML = [...mq, ...mq].map((t) => `<span><b>▸</b> ${esc(t)}</span>`).join("");
  const links = [
    C.email && { href: "mailto:" + C.email, label: C.email },
    C.linkedin && { href: C.linkedin, label: "LinkedIn" },
    C.github && { href: C.github, label: "GitHub" },
    C.resume && { href: C.resume, label: "Résumé" },
  ].filter(Boolean);
  $("#contactLinks").innerHTML = links.length
    ? links.map((l) => `<a class="c-link" href="${esc(l.href)}" ${l.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${esc(l.label)} <span class="arr">↗</span></a>`).join("")
    : "";

  /* ════════════ ROUTER ════════════ */
  const ROUTES = ["home", "systems", "approach", "stack", "contact"];
  const LABEL = { home: "Home", systems: "Systems", approach: "Approach", stack: "Stack", contact: "Contact" };
  let view = null, homeIntroDone = false, countersDone = false;

  function parse() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const v = ROUTES.includes(parts[0]) ? parts[0] : "home";
    return { v, sub: parts[1] };
  }
  function route() {
    const { v, sub } = parse();
    if (v !== view) {
      $$(".view").forEach((el) => {
        const on = el.dataset.view === v;
        el.classList.toggle("active", on);
        if (on) { el.classList.remove("view-enter"); void el.offsetWidth; el.classList.add("view-enter"); }
      });
      $$(".nav-links a").forEach((a) => a.classList.toggle("on", a.dataset.route === v));
      window.scrollTo(0, 0);
      const ni = ROUTES.indexOf(v) + 1;
      const np = $("#nextPage");
      np.classList.toggle("gone", ni >= ROUTES.length);
      if (ni < ROUTES.length) { np.href = "#/" + ROUTES[ni]; $("#nextLabel").textContent = LABEL[ROUTES[ni]]; }
      document.title = (v === "home" ? "" : LABEL[v] + " · ") + "Lakshya Jaiswal · Automation Engineer";
      view = v;
      if (v === "home") enterHome();
      if (v === "approach" && hasGsap) gsap.from(".principles li", { opacity: 0, y: 24, duration: .8, stagger: .08, ease: "expo.out" });
      if (v === "stack" && hasGsap) gsap.from(".stack-group", { opacity: 0, y: 24, duration: .8, stagger: .06, ease: "expo.out" });
      if (v === "contact" && hasGsap) gsap.from(".contact-title", { opacity: 0, y: 30, duration: 1, ease: "expo.out" });
    }
    if (v === "systems") {
      let i = S.findIndex((s) => s.id === sub);
      if (i < 0) i = cur >= 0 ? cur : 0;
      selectSystem(i);
    }
  }
  addEventListener("hashchange", route);

  /* ── home motion ── */
  const setCount = (el, val) => {
    const dec = +(el.dataset.dec || 0);
    el.textContent = (el.dataset.prefix || "") + val.toFixed(dec) + (el.dataset.suffix || "");
  };
  function enterHome() {
    const counters = $$("[data-count]");
    if (!hasGsap) { counters.forEach((el) => setCount(el, +el.dataset.count)); return; }
    if (!countersDone) {
      countersDone = true;
      counters.forEach((el) => { const o = { v: 0 }; gsap.to(o, { v: +el.dataset.count, duration: 1.8, delay: .5, ease: "power3.out", onUpdate: () => setCount(el, o.v) }); });
    }
    if (homeIntroDone) return;
    homeIntroDone = true;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".display .line > span", { yPercent: 110, duration: 1.3, stagger: .08 })
      .from(".eyebrow", { opacity: 0, y: 10, duration: .8 }, "-=1.1")
      .from(".lede, .hero-cta", { opacity: 0, y: 18, duration: 1, stagger: .08 }, "-=.9")
      .from(".home .metric", { opacity: 0, y: 16, duration: .8, stagger: .06 }, "-=.9")
      .from("#canvasWrap", { opacity: 0, y: 30, duration: 1.1 }, "-=.8")
      .add(() => setTimeout(() => view === "home" && hero.run(), 300));
  }

  /* ════════════ COMMAND PALETTE ════════════ */
  const pal = $("#palette"), pIn = $("#pInput"), pList = $("#pList");
  const cmds = [
    { t: "Execute the home workflow", k: "action", fn: () => { location.hash = "#/"; setTimeout(() => hero.run(), 400); } },
    ...ROUTES.map((r) => ({ t: LABEL[r], k: "page", fn: () => (location.hash = "#/" + (r === "home" ? "" : r)) })),
    ...S.map((s) => ({ t: s.title, k: "system", fn: () => (location.hash = "#/systems/" + s.id) })),
    C.email && { t: "Copy email address", k: "action", fn: () => navigator.clipboard?.writeText(C.email) },
  ].filter(Boolean);
  let shown = cmds, sel = 0;
  const paint = () => {
    pList.innerHTML = shown.map((c, i) => `<li role="option" class="${i === sel ? "sel" : ""}" data-i="${i}">${esc(c.t)}<small>${c.k}</small></li>`).join("") || `<li>No match</li>`;
    $$("li[data-i]", pList).forEach((li) => li.addEventListener("click", () => exec(+li.dataset.i)));
    pList.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
  };
  const openPal = () => { pal.classList.add("open"); pal.setAttribute("aria-hidden", "false"); pIn.value = ""; shown = cmds; sel = 0; paint(); setTimeout(() => pIn.focus(), 10); };
  const closePal = () => { pal.classList.remove("open"); pal.setAttribute("aria-hidden", "true"); };
  const exec = (i) => { const c = shown[i]; if (!c) return; closePal(); setTimeout(c.fn, 60); };
  pIn.addEventListener("input", () => {
    const q = pIn.value.toLowerCase().trim();
    shown = cmds.filter((c) => c.t.toLowerCase().includes(q) || c.k.includes(q)); sel = 0; paint();
  });
  pIn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); paint(); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    if (e.key === "Enter") { e.preventDefault(); exec(sel); }
  });
  $("#openPalette").addEventListener("click", openPal);
  $("[data-pclose]").addEventListener("click", closePal);
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.classList.contains("open") ? closePal() : openPal(); return; }
    if (e.key === "Escape" && pal.classList.contains("open")) { closePal(); return; }
    if (pal.classList.contains("open") || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (view === "systems" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      const n = (cur + (e.key === "ArrowRight" ? 1 : -1) + S.length) % S.length;
      location.hash = "#/systems/" + S[n].id;
    }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $("#openPalette").textContent = "Ctrl K";

  route();
})();
