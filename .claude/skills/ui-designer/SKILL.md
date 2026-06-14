---
name: ui-designer
description: Ochre/olive palette, data tables, price charts, RTL. Trigger on: "design tokens", "colors", "theme".
---
# UI Designer — Mawsim

## Design Tokens (Tailwind v4)
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');

@theme {
  --color-primary:     oklch(0.62 0.12 55);    /* warm ochre #C8873A */
  --color-primary-mid: oklch(0.72 0.10 55);
  --color-secondary:   oklch(0.38 0.09 145);   /* deep olive #3D5A3E */
  --color-secondary-fg: oklch(0.98 0 0);
  --color-bg:          oklch(0.98 0.005 65);   /* warm cream */
  --color-surface:     oklch(1.00 0 0);
  --color-border:      oklch(0.88 0.01 65);
  --color-foreground:  oklch(0.18 0.02 60);
  --color-muted:       oklch(0.55 0.01 60);
  /* Semantic */
  --color-premium:     oklch(0.62 0.12 55);    /* premium grade badge */
  --color-ok:          oklch(0.55 0.12 150);   /* deal completed */
  --color-warn:        oklch(0.72 0.14 75);    /* negotiating / pending */
  --color-danger:      oklch(0.52 0.20 25);    /* disputed / expired */
  /* Typography */
  --font-display: "Playfair Display", Georgia, serif;   /* premium, editorial */
  --font-body:    "Inter", system-ui, sans-serif;        /* data-forward, clean */
  --font-arabic:  "Noto Kufi Arabic", "Tahoma", sans-serif;
  --radius-card:  0.875rem;
}
```

## Component Specs
- **Listing card**: product photo (4:3), variety + region, grade badge (color-coded), qty in qtx, price/quintal (large, bold), certification icons, farmer rating
- **Price board**: zebra-striped table with sparkline per row; region filter tabs at top; "Last updated X min ago" badge
- **Deal timeline**: horizontal step tracker (offer → contract → deposit → transit → delivery → done)
- **Grade badge**: premium (ochre), grade_a (olive), grade_b (gray), standard (light gray)
- **Regional map**: Morocco SVG with clickable regions for filtering
