# Design System Document: The Intelligence Console

## 1. Overview & Creative North Star
**The Creative North Star: "The Tactical Observer"**

This design system moves away from the "generic SaaS dashboard" and leans into a sophisticated, high-density editorial aesthetic. It is designed to feel like a high-end command center—precise, authoritative, and calm. We avoid the "Lego-block" layout of standard dashboards by utilizing asymmetric spacing, deep tonal layering, and an "Atmospheric Dark" approach. 

The goal is to provide a "Blackbox" experience where the interface recedes, and the data (the signal) shines through. We achieve this through "The Ghost Interface" principle: UI elements should feel like they are projected onto a glass surface rather than printed on a plastic card.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
We use a sophisticated Material Design-inspired palette that prioritizes depth over structure.

### The Palette
- **Primary Surface (`surface`):** `#0b1326` – The deep, obsidian foundation.
- **Accent Primary (`primary`):** `#adc6ff` – A soft, luminous blue for high-priority actions.
- **Tertiary/Status (`tertiary`):** `#f7be1d` – A warm amber reserved for "Active" states and toggles.
- **Semantic Colors:** Error (`#ffb4ab`), Success (`#22c55e`).

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning. They create visual noise and "trap" the data. Instead:
- **Tonal Shifts:** Separate the main navigation from the IDE layout by shifting from `surface` to `surface-container-low`.
- **Nesting:** Place `surface-container-highest` cards (the "Active" focus) inside `surface-container` panels to create a natural hierarchy of importance.
- **The Glass Rule:** For floating panels (like IDE terminal popovers), use `surface-bright` at 60% opacity with a `20px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We utilize a dual-font strategy to balance technical precision with high-end readability.

*   **Display & Headlines (Plus Jakarta Sans):** Used for large stats and section titles. The high x-height and geometric curves feel modern and bespoke.
*   **Body & Labels (Inter):** Used for code, data points, and UI controls. Inter provides the "Technical" soul required for a Pi dashboard.

### Type Scale
- **Display-LG (3.5rem):** Reserved for "Hero Stats" (e.g., CPU Temp, Network Throughput).
- **Headline-SM (1.5rem):** Used for Service Card titles. Bold weight.
- **Label-MD (0.75rem):** Uppercase with 0.05em tracking for secondary metadata (e.g., "UPTIME", "IP ADDRESS").

---

## 4. Elevation & Depth: Tonal Layering
Instead of traditional drop shadows, we use **Tonal Stacking**.

1.  **Level 0 (The Void):** `surface` (`#0b1326`). Use for the global background.
2.  **Level 1 (The Panel):** `surface-container-low`. Use for the multi-panel IDE sidebar.
3.  **Level 2 (The Card):** `surface-container-high`. The standard card background.
4.  **Level 3 (The Focus):** `surface-container-highest`. Reserved for hovered states or active IDE tabs.

### Ambient Shadows
If an element must float (e.g., a dropdown), use a "Tinted Shadow":
- **Shadow:** `0px 24px 48px rgba(0, 0, 0, 0.4)`
- **Ghost Border Fallback:** If contrast is needed, use a `1px` stroke of `outline-variant` at 15% opacity. Never use 100% white or grey borders.

---

## 5. Components

### Stat Cards (The Macro View)
- **Background:** `surface-container-low`.
- **Content:** Large `display-sm` value in `on-surface`.
- **Progress Bars:** Use a "Track and Glow" style. The track is `surface-variant`. The fill is `primary`. Use a subtle outer glow (drop-shadow) on the fill to simulate a hardware LED.
- **Constraint:** No borders. Use `1.5rem` (xl) padding to let the data breathe.

### Service Cards & Status Badges
- **Status Badges:** Do not use solid blocks of color. Use a "Soft Pill": a background of the status color at 10% opacity with a `75%` opacity dot indicator.
- **Interaction:** On hover, the card should shift from `surface-container-high` to `surface-bright`.

### Toggle Switches (The "Hardware" Look)
- **OFF State:** `outline` track with a `surface` thumb.
- **ON State:** `tertiary` (Amber) track. This provides a warm, incandescent glow reminiscent of vintage hardware indicators.

### Multi-Panel IDE Layout
- **Gutter Spacing:** Use `0px` gutters with `1px` `outline-variant` separators (at 10% opacity) between panels to maximize screen real estate.
- **Active Tab:** Indicated by a `2px` `primary` top-border and a `surface-container-highest` background.

### Input Fields
- **Style:** Understated. `surface-container-lowest` background with a `1px` `outline-variant` (20% opacity) bottom-border only. 
- **Focus:** The bottom-border transitions to `primary` 100% opacity.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** If a dashboard column is less important, make it narrower. Do not force a 3-column equal grid.
- **Use High-Contrast Stats:** Make your primary numbers (`display` scale) significantly larger than their labels to create a clear visual entry point.
- **Use Lucide Icons:** Keep strokes at `1.5px` to match the "Thin & Technical" aesthetic of the Inter typeface.

### Don't:
- **Don't use Dividers:** Avoid horizontal lines in lists. Use `12px` of vertical white space or a 2% shift in background color between rows.
- **Don't use Pure White:** In Dark Mode, use `on-surface-variant` (`#c2c6d6`) for body text. Pure white (`#ffffff`) causes "Halation" (visual vibrating) against deep navy backgrounds.
- **Don't Over-Round:** Stick to the `md` (0.75rem) and `lg` (1rem) tokens. Avoid "Pill" shapes for everything except buttons and badges; let the layout feel structured, not bubbly.