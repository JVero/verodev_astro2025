# Vero Design System

The shared aesthetic across vero.dev apps. Warm minimalism with editorial bones.

**Source of truth:** `src/lib/styles.js` in any vero app.

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Headings (h1, h2) | Newsreader (serif) | 700 | 22px (h2), 28px (h1) |
| Section labels (h3) | System sans | 600 | 12px, uppercase, 0.06em tracking |
| Body text | System sans | 400 | 15px, line-height 1.8 |
| UI labels, buttons | System sans | 500-600 | 12-14px |
| Code | SF Mono / Fira Code / Menlo | 400 | 13px |

```js
const SERIF = '"Newsreader", ui-serif, Georgia, Cambria, serif';
const SANS = '-apple-system, system-ui, "Segoe UI", sans-serif';
```

**Load Newsreader** from Google Fonts in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&display=swap" rel="stylesheet" />
```

---

## Color Palette

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#FAF9F6` | Page background (warm off-white) |
| `card` | `#FFFFFF` | Card/container backgrounds |
| `border` | `#E8E4E0` | Subtle borders, dividers |
| `borderMed` | `#D6D3D1` | Input borders, stronger dividers |
| `text` | `#1C1917` | Primary text (near-black, warm) |
| `textMid` | `#57534E` | Secondary text, UI labels |
| `textMuted` | `#A8A29E` | Tertiary text, timestamps, hints |
| `accent` | `#C15F3C` | Rust/terracotta — links, buttons, brand |
| `inputBg` | `#FFFFFF` | Input backgrounds |

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#1C1917` | Page background (warm black) |
| `card` | `#292524` | Card backgrounds |
| `border` | `#3D3936` | Subtle borders |
| `borderMed` | `#57534E` | Input borders |
| `text` | `#E7E5E4` | Primary text |
| `textMid` | `#A8A29E` | Secondary text |
| `textMuted` | `#78716C` | Tertiary text |
| `accent` | `#D97756` | Accent (lighter rust for contrast) |
| `inputBg` | `#292524` | Input backgrounds |

### Key Principle
All grays are **warm stone** tones (from the Tailwind Stone scale), never blue-gray. This is what gives the palette its warmth.

---

## Surfaces & Shadows

**Cards:**
```js
{
  background: card,
  borderRadius: 8,
  border: `1px solid ${border}`,
  boxShadow: dark
    ? "0 1px 3px rgba(0,0,0,0.3)"        // dark: stronger, pure black
    : "0 1px 3px rgba(120,113,108,0.08)",  // light: warm stone tint
}
```

**Card hover (interactive cards only):**
```js
onMouseEnter: {
  transform: "translateY(-1px)",
  boxShadow: dark
    ? "0 4px 12px rgba(0,0,0,0.4)"
    : "0 4px 12px rgba(120,113,108,0.12)",
  borderColor: borderMed,
}
```
Shadow color is `rgba(120,113,108,...)` — stone-tinted, not pure black.

**Page background texture (light mode only):**
```js
backgroundImage: `url("data:image/svg+xml,...")` // repeating dot pattern
```
A subtle speckle using stone-colored (#78716C) SVG circles at 7-12% opacity. Gives a tactile paper feel.

**Page background (dark mode):**
```js
backgroundImage: "radial-gradient(ellipse at 50% 0%, #1E1B19 0%, #1A1714 100%)"
```
Warm radial gradient, slightly lighter at top center. Feels like ambient lighting.

---

## Spacing & Layout

| Element | Value |
|---------|-------|
| Page padding | 24px + safe-area-inset (mobile-safe) |
| Max content width | 560px (default), 700px (>900px screen), 800px (>1200px screen) |
| Wide mode (editing) | up to 1060px |
| Card padding | 16px 18px |
| Content padding (reading) | 20px 24px |
| Card margin-bottom | 14px |
| Card border-radius | 8px |
| Button border-radius | 6px |
| Pill/chip border-radius | 4px (tags), 20px (filter chips) |

**Responsive width:**
```js
const maxW = winWidth >= 1200 ? 800 : winWidth >= 900 ? 700 : 560;
```

---

## Buttons

**Primary:** Solid accent background, white text
```js
{ background: accent, color: "#fff", fontWeight: 600, fontSize: 13, padding: "7px 16px", borderRadius: 6 }
```

**Ghost:** Outlined, medium border
```js
{ background: "none", border: `1px solid ${borderMed}`, color: textMid, fontSize: 13, padding: "6px 14px", borderRadius: 6 }
```

**Text:** No border, accent color
```js
{ background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 500 }
```

**Back:** Subtle, left-aligned
```js
{ background: "none", border: "none", color: textMid, fontSize: 14, padding: "4px 0", marginBottom: 16 }
```

---

## Inputs

```js
{
  background: inputBg,
  border: `1px solid ${borderMed}`,
  borderRadius: 6,
  color: text,
  fontSize: 14,
  padding: "8px 10px",
  fontFamily: "inherit",
  outline: "none",
}
```

On focus, border changes to `accent` color (implemented per-component, not in makeStyles).

---

## Transitions & Motion

| Transition | Duration | Easing |
|------------|----------|--------|
| View fade + slide | opacity 120ms, transform 180ms | ease |
| Background color | 300ms | ease |
| Card hover lift | 150ms | ease |
| Border color | 120ms | ease |
| Max-width (wide mode) | 300ms | ease |

**View transitions** include a 6px vertical shift:
```js
style={{ opacity: viewFade, transform: `translateY(${viewFade === 1 ? 0 : 6}px)` }}
```

**`fadeTo(fn)` pattern:** Set opacity to 0, wait 120ms, execute fn, set opacity to 1.

---

## Dark Mode

- Toggle persists to `localStorage` key: `{app}-dark` (e.g., `notes-dark`, `learn-dark`)
- Prevent flash: inline `<script>` in `index.html` reads localStorage before React mounts and sets `body.style.background`
- `makeStyles(dark, maxW)` regenerates all styles when `dark` changes
- Dark mode uses the same layout, just different color tokens

---

## Markdown Rendering

Uses `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex`.

Key styling decisions:
- Headings use Newsreader serif
- Body text at 15px with 1.8 line-height (generous, editorial)
- Code blocks have a language label bar (uppercase, 11px, muted)
- Blockquotes are italic with accent-colored left border
- Links use accent color with subtle underline (`border-bottom: 1px solid ${accent}40`)
- Drop cap on first paragraph of long content (>400 chars): 52px Newsreader initial in accent color

**KaTeX** for LaTeX math — load CSS from CDN in `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
```

---

## index.html Boilerplate

Every vero app should have:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#C15F3C" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

Global styles:
```css
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
button, a, select, input, [onClick] { touch-action: manipulation; }
::selection { background: rgba(193, 95, 60, 0.15); }
body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
```

---

## Navigation Patterns

- **Hash-based routing** (`#`, `#note/{id}`, `#new`, etc.)
- **`fadeTo(fn)`** transitions between views
- **`popstate`** handler for browser back/forward
- **Swipe-right-to-go-back** on mobile (startX < 40px, dx > 80px, dy < dx * 0.5)
- **`history.pushState`** on navigation, `skipPush` flag for popstate-triggered navigation

---

## Auth Pattern (AuthGate)

Every authenticated app wraps content in an `AuthGate` component:
- Checks `supabase.auth.getSession()` on mount
- Subscribes to `onAuthStateChange`
- Three states: loading (spinner), unauthenticated (login form), authenticated (children)
- Login form: centered, max-width 320px, lock emoji, app name in Newsreader, email/password inputs

---

## File Structure Convention

```
app-name/
├── index.html
├── package.json
├── vite.config.js          # react + qrcode (dev), host: true
├── vercel.json             # --legacy-peer-deps, SPA rewrite
├── .env                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── src/
│   ├── main.jsx
│   ├── App.jsx             # AuthGate + main app + routing
│   └── lib/
│       ├── supabase.js     # createClient singleton
│       ├── styles.js       # makeStyles + tokens
│       ├── storage.js      # Supabase CRUD functions
│       └── utils.jsx       # Shared utilities
└── mcp-server/
    ├── package.json        # type: module, MCP SDK + Supabase + zod
    └── index.js            # McpServer + StdioServerTransport
```
