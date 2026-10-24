# Lakshya Jaiswal · Portfolio

Personal portfolio: production automation systems built in n8n and Claude.

- Plain HTML, CSS and JS. There is no build step.
- Edit content in `data.js` (contact links in `CONFIG`, case studies in `SYSTEMS`).
- Library: GSAP (cdnjs). Pages are hash-routed (#/systems, #/systems/<id>), so GitHub Pages needs no server config.
- Each system's interactive canvas is defined in `graphs.js` (nodes, wires, replay steps). Fonts: Geist, Geist Mono and Instrument Serif (Google Fonts).
- Hosted on GitHub Pages.

Run locally: `python -m http.server` and then open http://localhost:8000
