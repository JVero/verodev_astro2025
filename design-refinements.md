# Design Refinements Guide

How to propagate the warm-minimalist aesthetic refinements across vero.dev apps.

---

## 1. Paper Grain Texture

A barely-visible SVG noise texture on the page background. Gives the surface a tactile, paper-like feel without being distracting.

**Where:** The outermost shell/container `background` property.

```js
// In makeStyles(), add to the shell style:
shell: {
  // ...existing styles...
  backgroundImage: dark
    ? "none"
    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E")`,
}
```

Light mode only — dark mode looks better without it.

---

## 2. Warm Card Shadows + Hover Lift

Cards cast a warm-tinted shadow (stone-colored, not pure black). On hover, cards lift 1px with a deeper shadow — feels like picking up an index card.

**Where:** Any clickable card (note cards, collection cards).

```js
// Base card style:
{
  // ...existing border/bg...
  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.12s ease",
  boxShadow: dark
    ? "0 1px 3px rgba(0,0,0,0.3)"
    : "0 1px 3px rgba(120,113,108,0.08)",  // warm stone tint
}

// On hover (via onMouseEnter/Leave):
{
  transform: "translateY(-1px)",
  boxShadow: dark
    ? "0 4px 12px rgba(0,0,0,0.4)"
    : "0 4px 12px rgba(120,113,108,0.12)",
  borderColor: S.borderMed,  // slightly stronger border
}

// On mouse leave, reset to defaults.
```

---

## 3. View Transitions with Vertical Shift

Content slides up 6px as it fades in — like turning a page. More subtle than a slide, more alive than a plain fade.

**Where:** The shell div that wraps all content (where `opacity: viewFade` is applied).

```js
// Replace simple opacity transition with:
style={{
  ...S.shell,
  opacity: viewFade,
  transform: `translateY(${viewFade === 1 ? 0 : 6}px)`,
  transition: "opacity 0.12s ease, transform 0.18s ease, background 0.3s ease",
}}
```

---

## 4. Editorial Timestamps

Within the last 24 hours: relative ("2h ago", "just now").
Older: editorial date format ("21 Mar", "14 Feb 2025").

```js
export function relativeTime(dateStr) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  // Editorial format for older dates
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const thisYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  const formatted = `${date.getDate()} ${months[date.getMonth()]}`;
  return dateYear === thisYear ? formatted : `${formatted} ${dateYear}`;
}
```

---

## 5. Wider Content Padding

Note content gets more breathing room — editorial publications use generous margins.

**Where:** The content rendering container in detail/reader views.

```js
// Content wrapper:
{
  padding: "20px 24px",  // was 14px 16px
  // ...rest of card styles
}
```

---

## 6. Drop Cap on Long Notes

The first letter of long notes (>400 chars) gets a large Newsreader initial cap. Classic editorial touch.

**Where:** The `makeMdComponents` function — override the first `<p>` component.

Approach: Track whether the first paragraph has been rendered. If content is long enough and it's the first `<p>`, apply drop cap styling.

```jsx
// In the markdown components, wrap the p component:
p: ({ children, node }) => {
  // Check if this is the first paragraph (node.position.start.line <= 2)
  const isFirst = node?.position?.start?.line <= 1;
  if (isFirst && contentLength > 400) {
    return (
      <p style={{ ...baseP, fontSize: 15 }}>
        <span style={{
          float: "left",
          fontSize: 48,
          lineHeight: "36px",
          fontFamily: SERIF,
          fontWeight: 700,
          color: accent,
          padding: "4px 8px 0 0",
        }}>{firstChar}</span>
        {restOfChildren}
      </p>
    );
  }
  return <p style={baseP}>{children}</p>;
}
```

---

## 7. Pinned Notes with Bookmark Accent

Pinned notes get a colored left border — like a ribbon bookmark sticking out of a journal.

**Where:** The pinned note cards on the dashboard.

```js
// Pinned card style addition:
{
  borderLeft: `3px solid ${S.accent}`,
}
```

---

## 8. Tag Color Dots

Tags show their stored color as a small dot before the name, rather than all being neutral gray.

**Where:** Tag pills in note cards, detail view, etc.

```jsx
<span style={{ /* tag pill styles */ }}>
  {tagColor && (
    <span style={{
      display: "inline-block",
      width: 6, height: 6,
      borderRadius: "50%",
      background: tagColor,
      marginRight: 4,
      verticalAlign: "middle",
    }} />
  )}
  {tag.name}
</span>
```

Requires passing tag colors from `loadTags()` to the components that render them.

---

## 9. Code Block Language Bar

Fenced code blocks get a subtle top bar showing the language label.

**Where:** The `pre` and `code` components in `makeMdComponents`.

```jsx
pre: ({ children }) => (
  <pre style={{
    background: dark ? "#1C1917" : "#F5F5F4",
    border: `1px solid ${S.border}`,
    borderRadius: 6,
    padding: 0,
    overflow: "hidden",
    margin: "12px 0",
  }}>
    {children}
  </pre>
),
code: ({ inline, children, className }) => {
  if (inline) return <code style={inlineCodeStyle}>...</code>;
  const lang = className?.replace("language-", "") || "";
  return (
    <div>
      {lang && (
        <div style={{
          fontSize: 11, fontWeight: 500, color: textMuted,
          padding: "4px 12px",
          borderBottom: `1px solid ${border}`,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}>
          {lang}
        </div>
      )}
      <code style={{ display: "block", padding: 12, overflowX: "auto", fontSize: 13, lineHeight: 1.5 }}>
        {children}
      </code>
    </div>
  );
}
```

---

## 10. Dark Mode Warm Gradient

Dark mode shell gets a barely perceptible radial gradient — feels like ambient warm lighting rather than flat darkness.

```js
// In makeStyles(), dark mode shell:
shell: {
  background: dark
    ? "radial-gradient(ellipse at 50% 0%, #1E1B19 0%, #1A1714 100%)"
    : bg,
  // ...rest
}
```

---

## Summary of Files to Change Per App

| File | Refinements |
|------|-------------|
| `styles.js` / `makeStyles()` | Paper grain (#1), warm shadows (#2), dark gradient (#10) |
| `App.jsx` | View transition shift (#3) |
| `utils.jsx` / `relativeTime()` | Editorial timestamps (#4) |
| `utils.jsx` / `makeMdComponents()` | Wider padding (#5), drop cap (#6), code block bar (#9) |
| Dashboard view | Card hover (#2), pinned bookmark (#7), tag dots (#8) |
| Detail view | Wider padding (#5), tag dots (#8) |
