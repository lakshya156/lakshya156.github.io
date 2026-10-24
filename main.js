(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = window.SYSTEMS || [];
  const C = window.CONFIG || {};
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  $("#yr").textContent = new Date().getFullYear();

  /* ── IST clock ── */
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  const tick = () => (clock.textContent = "IST " + fmt.format(new Date()));
  tick(); setInterval(tick, 15000);

  /* ── cursor spotlight + nav border ── */
  addEventListener("pointermove", (e) => {
    document.documentElement.style.setProperty("--mx", e.clientX + "px");
    document.documentElement.style.setProperty("--my", e.clientY + "px");
  }, { passive: true });
  const nav = $(".nav");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 10), { passive: true });

  /* ── smooth scroll ── */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.11 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
  }
  const goTo = (sel) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1 && $(id)) { e.preventDefault(); goTo(id); }
  }));

  /* ════════════ HERO WORKFLOW CANVAS ════════════ */
  const NW = 196, NH = 66;
  const nodes = [
    { id: "trig", x: 30, y: 197, ico: "⏲", lbl: "Schedule", sub: "cron trigger" },
    { id: "fetch", x: 270, y: 96, ico: "{}", lbl: "News Fetch", sub: "GDELT · 19 queries" },
    { id: "reddit", x: 270, y: 300, ico: "r/", lbl: "Reddit Monitor", sub: "thread watch" },
    { id: "scrape", x: 510, y: 197, ico: "</>", lbl: "Scrape + Clean", sub: ">350w · Jina fallback" },
    { id: "judge", x: 750, y: 197, ico: "AI", lbl: "Severity Judge", sub: "LLM · score 1–10" },
    { id: "match", x: 978, y: 90, ico: "in", lbl: "Identity Match", sub: "4-tier LinkedIn" },
    { id: "drop", x: 978, y: 306, ico: "×", lbl: "Discard", sub: "not worth a pitch" },
  ];
  const edges = [
    { a: "trig", b: "fetch" }, { a: "trig", b: "reddit" },
    { a: "fetch", b: "scrape" }, { a: "reddit", b: "scrape" },
    { a: "scrape", b: "judge" },
    { a: "judge", b: "match", label: "≥ 5" },
    { a: "judge", b: "drop", label: "< 5", off: true },
  ];
  const N = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const flow = $("#flow"), gE = $("#edges"), gN = $("#nodes"), gP = $("#packets");
  const pathD = (a, b) => {
    const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2;
    const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };
  edges.forEach((e) => {
    e.el = svgEl("path", { class: "edge" + (e.off ? " off" : "") }, gE);
    if (e.label) e.t = svgEl("text", { class: "edge-label", "text-anchor": "middle" }, gE), (e.t.textContent = e.label);
  });
  const drawEdges = () => edges.forEach((e) => {
    e.el.setAttribute("d", pathD(N[e.a], N[e.b]));
    if (e.t) {
      const L = e.el.getTotalLength(), p = e.el.getPointAtLength(L * 0.55);
      e.t.setAttribute("x", p.x); e.t.setAttribute("y", p.y - 8);
    }
  });
  nodes.forEach((n) => {
    const g = svgEl("g", { class: "node", tabindex: "0", role: "img", "aria-label": `${n.lbl}: ${n.sub}` }, gN);
    svgEl("rect", { class: "body", width: NW, height: NH, rx: 12 }, g);
    svgEl("rect", { class: "ico", x: 12, y: 13, width: 40, height: 40, rx: 9 }, g);
    const it = svgEl("text", { class: "ico-t", x: 32, y: 38, "text-anchor": "middle" }, g); it.textContent = n.ico;
    const l = svgEl("text", { class: "lbl", x: 64, y: 30 }, g); l.textContent = n.lbl;
    const s = svgEl("text", { class: "sub", x: 64, y: 48 }, g); s.textContent = n.sub;
    svgEl("circle", { class: "status", cx: NW - 14, cy: 14, r: 4, fill: "var(--ok)" }, g);
    if (n.id !== "trig") svgEl("circle", { class: "port", cx: 0, cy: NH / 2, r: 5 }, g);
    if (!["match", "drop"].includes(n.id)) svgEl("circle", { class: "port", cx: NW, cy: NH / 2, r: 5 }, g);
    n.g = g;
    g.setAttribute("transform", `translate(${n.x},${n.y})`);
  });
  drawEdges();

  // dragging
  let drag = null;
  const toSvg = (e) => {
    const pt = flow.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(flow.getScreenCTM().inverse());
  };
  nodes.forEach((n) => n.g.addEventListener("pointerdown", (e) => {
    const p = toSvg(e);
    drag = { n, dx: p.x - n.x, dy: p.y - n.y };
    n.g.classList.add("dragging");
    gN.appendChild(n.g);
    flow.setPointerCapture(e.pointerId);
    $(".canvas-hint") && ($(".canvas-hint").style.opacity = 0);
  }));
  flow.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = toSvg(e);
    drag.n.x = Math.max(0, Math.min(1200 - NW, p.x - drag.dx));
    drag.n.y = Math.max(0, Math.min(460 - NH, p.y - drag.dy));
    drag.n.g.setAttribute("transform", `translate(${drag.n.x},${drag.n.y})`);
    drawEdges();
  });
  const endDrag = () => { if (drag) drag.n.g.classList.remove("dragging"); drag = null; };
  flow.addEventListener("pointerup", endDrag);
  flow.addEventListener("pointercancel", endDrag);

  // execution replay
  const term = $("#terminal");
  const log = (html, cls = "") => {
    const d = document.createElement("div");
    d.className = "t-line " + cls; d.innerHTML = html;
    term.appendChild(d);
    while (term.children.length > 7) term.firstChild.remove();
  };
  const ts = () => { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map((x) => String(x).padStart(2, "0")).join(":"); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const sendPacket = (e, ms = 700) => new Promise((res) => {
    e.el.classList.add("lit");
    if (reduce) { setTimeout(res, 120); return; }
    const c = svgEl("circle", { class: "packet", r: 5 }, gP);
    const L = e.el.getTotalLength(); let t0 = null;
    const step = (t) => {
      t0 ??= t; const k = Math.min(1, (t - t0) / ms);
      const p = e.el.getPointAtLength(L * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
      c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
      k < 1 ? requestAnimationFrame(step) : (c.remove(), res());
    };
    requestAnimationFrame(step);
  });
  const E = (a, b) => edges.find((e) => e.a === a && e.b === b);
  const mark = (id, state) => { const g = N[id].g; g.classList.remove("active", "done"); state && g.classList.add(state); };
  let running = false;
  const runBtn = $("#runHero");
  async function run() {
    if (running) return; running = true; runBtn.disabled = true;
    nodes.forEach((n) => mark(n.id)); edges.forEach((e) => e.el.classList.remove("lit"));
    term.innerHTML = "";
    const L = (who, msg, cls) => log(`<span class="t-dim">${ts()}</span>  <span class="t-acc">${who}</span>  ${msg}`, cls);
    log(`<span class="t-dim">$</span> n8n execute --workflow orm-lead-engine`, "t-dim");
    mark("trig", "active"); await wait(350); L("schedule", "trigger fired"); mark("trig", "done");
    mark("fetch", "active"); mark("reddit", "active");
    await Promise.all([sendPacket(E("trig", "fetch")), sendPacket(E("trig", "reddit"))]);
    L("gdelt", "19 news queries dispatched"); L("reddit", "new threads pulled");
    mark("fetch", "done"); mark("reddit", "done"); mark("scrape", "active");
    await Promise.all([sendPacket(E("fetch", "scrape")), sendPacket(E("reddit", "scrape"))]);
    L("scrape", "batches of 25 · keep &gt;350 words, else Jina Reader"); mark("scrape", "done");
    mark("judge", "active"); await sendPacket(E("scrape", "judge"));
    L("ai-judge", "severity + ability-to-pay scored per story"); mark("judge", "done");
    mark("match", "active"); mark("drop", "active");
    await Promise.all([sendPacket(E("judge", "match"), 800), sendPacket(E("judge", "drop"), 800)]);
    L("discard", "low-severity stories dropped before any paid lookup", "t-dim"); mark("drop", "done");
    L("identity", "entity → 4-tier LinkedIn search → AI verify → domain"); mark("match", "done");
    await wait(250);
    log(`<span class="t-ok">✓ execution finished</span> <span class="t-dim">· leads written to the prospect sheet</span>`);
    running = false; runBtn.disabled = false;
  }
  runBtn.addEventListener("click", () => { goTo("#canvasWrap"); run(); });

  /* ════════════ SYSTEMS ════════════ */
  const grid = $("#systemGrid");
  const chainHTML = (arr) => arr.map((n, i) => `${i ? '<span class="w"></span>' : ""}<span class="n">${esc(n)}</span>`).join("");
  const wideIdx = new Set([0, 6]);
  grid.innerHTML = S.map((s, i) => `
    <button class="card rv${wideIdx.has(i) ? " wide" : ""}" data-cat="${s.cat}" data-i="${i}" aria-label="Open ${esc(s.title)}">
      <div class="card-top mono"><span class="card-kicker">${esc(s.kicker)}</span><span class="card-idx">${String(i + 1).padStart(2, "0")}</span></div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.summary)}</p>
      <div class="chain">${chainHTML(s.chain)}</div>
      <div class="card-stat"><div><b>${esc(s.stat[0])}</b> <span class="mono">${esc(s.stat[1])}</span></div><span class="open mono">open <span aria-hidden="true">→</span></span></div>
    </button>`).join("");
  $$(".card", grid).forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--cx", e.clientX - r.left + "px");
      c.style.setProperty("--cy", e.clientY - r.top + "px");
    });
    c.addEventListener("click", () => openDrawer(+c.dataset.i));
  });

  // filters
  $$("#filters .chip").forEach((b) => b.addEventListener("click", () => {
    $$("#filters .chip").forEach((x) => x.classList.toggle("is-on", x === b));
    const f = b.dataset.f;
    $$(".card", grid).forEach((c) => {
      const show = f === "all" || c.dataset.cat === f;
      c.classList.toggle("hide", !show);
      c.classList.toggle("wide", show && f === "all" && wideIdx.has(+c.dataset.i));
    });
    if (window.gsap && !reduce) gsap.fromTo($$(".card:not(.hide)", grid), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5, stagger: .05, ease: "power3.out" });
    window.ScrollTrigger && ScrollTrigger.refresh();
  }));

  // drawer
  const drawer = $("#drawer"), dBody = $("#drawerBody");
  let cur = 0, lastFocus = null;
  const flowSVG = (chain) => {
    const w = 150, h = 54, gap = 34, pad = 8;
    const W = chain.length * w + (chain.length - 1) * gap + pad * 2, H = h + 40;
    let out = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Workflow: ${esc(chain.join(" to "))}"><defs><pattern id="dg2" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--grid)"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#dg2)"/>`;
    chain.forEach((n, i) => {
      const x = pad + i * (w + gap), y = 20;
      if (i) out += `<path class="edge lit" d="M${x - gap},${y + h / 2} L${x},${y + h / 2}"/>`;
      out += `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="var(--panel-2)" stroke="${i === 0 ? "var(--accent)" : "var(--line-2)"}"/>
        <text x="${x + 12}" y="${y + 20}" fill="var(--mute)" font-family="var(--mono)" font-size="10">${String(i + 1).padStart(2, "0")}</text>
        <text x="${x + 12}" y="${y + 39}" fill="var(--ink)" font-family="var(--sans)" font-size="13" font-weight="500">${esc(n.length > 19 ? n.slice(0, 18) + "…" : n)}</text></g>`;
    });
    return out + "</svg>";
  };
  function renderDrawer(i) {
    const s = S[i], prev = S[(i - 1 + S.length) % S.length], next = S[(i + 1) % S.length];
    dBody.innerHTML = `
      <span class="d-kicker mono">${String(i + 1).padStart(2, "0")} · ${esc(s.kicker)}</span>
      <h2 class="d-title" id="dTitle">${esc(s.title)}</h2>
      <p class="d-sum">${esc(s.summary)}</p>
      <div class="d-flow">${flowSVG(s.chain)}</div>
      <div class="d-sec"><h4>The problem</h4><p>${esc(s.problem)}</p></div>
      <div class="d-sec"><h4>What I built</h4><ul>${s.built.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
      <div class="d-sec d-hard"><h4>The hard part</h4><p>${esc(s.hard)}</p></div>
      <div class="d-sec"><h4>Stack</h4><div class="d-stack">${s.stack.map((t) => `<span>${esc(t)}</span>`).join("")}</div></div>
      <div class="d-nav mono"><button data-go="${(i - 1 + S.length) % S.length}">← ${esc(prev.title)}</button><button data-go="${(i + 1) % S.length}">${esc(next.title)} →</button></div>`;
    $$("[data-go]", dBody).forEach((b) => b.addEventListener("click", () => openDrawer(+b.dataset.go)));
    $(".drawer-panel").scrollTop = 0;
  }
  function openDrawer(i) {
    cur = i; if (!drawer.classList.contains("open")) lastFocus = document.activeElement;
    renderDrawer(i);
    drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false");
    lenis && lenis.stop(); document.body.style.overflow = "hidden";
    setTimeout(() => $(".drawer-x").focus(), 50);
  }
  function closeDrawer() {
    drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true");
    lenis && lenis.start(); document.body.style.overflow = "";
    lastFocus && lastFocus.focus();
  }
  $$("[data-close]", drawer).forEach((b) => b.addEventListener("click", closeDrawer));

  /* ════════════ STACK + MARQUEE ════════════ */
  $("#stackList").innerHTML = (window.STACK || []).map((g) =>
    `<div class="stack-group rv"><h4>${esc(g.group)}</h4><ul>${g.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join("");
  const mq = ["webhook → agent → human handoff", "schedule → scrape → judge → enrich", "reply → classify → counter-offer", "post → classify → comment draft", "feed → byline → verify → pitch", "error → alert → fix"];
  $("#marquee").innerHTML = [...mq, ...mq].map((t) => `<span><b>▸</b> ${esc(t)}</span>`).join("");

  /* ════════════ CONTACT ════════════ */
  const links = [
    C.email && { href: "mailto:" + C.email, label: C.email },
    C.linkedin && { href: C.linkedin, label: "LinkedIn" },
    C.github && { href: C.github, label: "GitHub" },
    C.resume && { href: C.resume, label: "Résumé" },
  ].filter(Boolean);
  $("#contactLinks").innerHTML = links.length
    ? links.map((l) => `<a class="c-link" href="${esc(l.href)}" ${l.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${esc(l.label)} <span class="arr">↗</span></a>`).join("")
    : `<span class="mono mute">Add your email and links in data.js → CONFIG</span>`;

  /* ════════════ COMMAND PALETTE ════════════ */
  const pal = $("#palette"), pIn = $("#pInput"), pList = $("#pList");
  const cmds = [
    { t: "Execute the hero workflow", k: "action", fn: () => { goTo("#canvasWrap"); run(); } },
    { t: "Systems", k: "section", fn: () => goTo("#systems") },
    { t: "Principles", k: "section", fn: () => goTo("#principles") },
    { t: "Stack", k: "section", fn: () => goTo("#stack") },
    { t: "Contact", k: "section", fn: () => goTo("#contact") },
    ...S.map((s, i) => ({ t: s.title, k: "system", fn: () => openDrawer(i) })),
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
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.classList.contains("open") ? closePal() : openPal(); }
    if (e.key === "Escape") { if (pal.classList.contains("open")) closePal(); else if (drawer.classList.contains("open")) closeDrawer(); }
    if (drawer.classList.contains("open") && !pal.classList.contains("open")) {
      if (e.key === "ArrowRight") openDrawer((cur + 1) % S.length);
      if (e.key === "ArrowLeft") openDrawer((cur - 1 + S.length) % S.length);
    }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $("#openPalette").textContent = "Ctrl K";

  /* ════════════ MOTION ════════════ */
  const counters = $$("[data-count]");
  const setCount = (el, v) => {
    const dec = +(el.dataset.dec || 0);
    el.textContent = (el.dataset.prefix || "") + v.toFixed(dec) + (el.dataset.suffix || "");
  };
  if (!window.gsap || reduce) {
    document.documentElement.classList.remove("js");
    counters.forEach((el) => setCount(el, +el.dataset.count));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".display .line > span", { yPercent: 110, duration: 1.3, stagger: .08 })
    .from(".eyebrow", { opacity: 0, y: 10, duration: .8 }, "-=1.1")
    .from(".lede, .hero-cta", { opacity: 0, y: 18, duration: 1, stagger: .08 }, "-=.9")
    .from(".canvas-wrap", { opacity: 0, y: 40, duration: 1.2 }, "-=.8")
    .from("#nodes .node", { opacity: 0, scale: .9, transformOrigin: "center", duration: .6, stagger: .05 }, "-=.9")
    .add(() => {
      // auto-play once when the canvas is on screen
      ScrollTrigger.create({ trigger: "#canvasWrap", start: "top 75%", once: true, onEnter: () => setTimeout(run, 400) });
    });

  counters.forEach((el) => {
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: +el.dataset.count, duration: 1.8, ease: "power3.out", onUpdate: () => setCount(el, o.v) }) });
  });

  $$(".section-head, .principles li, .contact-title, .metrics").forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  ScrollTrigger.batch(".rv", {
    start: "top 90%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: .07, ease: "expo.out", overwrite: true }),
  });
})();
