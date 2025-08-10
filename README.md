# Profile Website

Minimal, Apple-inspired profile site with an OLED-black look, subtle South Indian touch, and smooth, performant animations.

## Features

- OLED-black, Apple-like design with clean typography
- Off-canvas sidebar menu with overlay and ESC to close
- Smooth scrolling and reveal-on-scroll animations
- Hero background: p5.js Concentric Wavy Rings (white, subtle, perf-aware)
- Minimalist “sleeping cat” SVG in the top-right background (hover: one eye; click: wake, then sleep)
- Performance-friendly: respects reduced-motion, enables a low-power mode on slower devices
- Responsive layout

## Getting started

1) Download/clone the repo
2) Open `index.html` in your browser

No build step required.

## File structure

```
Profile/
├── index.html   # Markup and sections
├── styles.css   # Theme, layout, animations
├── script.js    # Interactions, p5 rings, sidebar, cat
└── README.md    # This file
```

## Customize

- Content: edit text and sections in `index.html`
- Colors: adjust CSS variables and accents in `styles.css` (accent uses LTT orange: `#FF6B00`)
- Rings background: tweak values in `script.js` inside `attachP5Rings` (rings count, base radius, gap, opacity)

## Keyboard shortcuts

- h → scroll to Home
- c → scroll to Contact

## Notes

- Animations respect `prefers-reduced-motion`
- A lightweight FPS probe automatically enables a “perf” mode on low-end devices

— Built with care in South India
