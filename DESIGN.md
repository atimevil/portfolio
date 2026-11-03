---
name: foxibu
description: Monochrome portfolio where the work itself (video, figures, records) carries all the color.
colors:
  night-ground: "#0a0a0a"
  night-tile: "#111111"
  night-surface: "#1a1a1a"
  night-rule: "#262626"
  night-ink: "#ededed"
  night-ink-secondary: "#a1a1a1"
  night-ink-muted: "#8f8f8f"
  night-ink-max: "#ffffff"
  night-polaroid: "#1c1c1c"
  night-tape: "rgba(214, 204, 172, 0.30)"
  paper-ground: "#ffffff"
  paper-tile: "#fafafa"
  paper-surface: "#f5f5f5"
  paper-rule: "#ebebeb"
  sumi-ink: "#171717"
  sumi-ink-secondary: "#4d4d4d"
  sumi-ink-muted: "#6b6b6b"
  sumi-ink-max: "#000000"
  paper-tape: "rgba(226, 216, 186, 0.78)"
  code-slate: "#1e293b"
  admin-danger: "#ef4444"
typography:
  display:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  display-wide:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  body:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  body-small:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  caption:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  code:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  sm: "2px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  gap-tight: "12px"
  gap: "16px"
  tile-pad: "24px"
  tile-pad-lead: "32px"
  tile-pad-lead-lg: "40px"
  gutter: "16px"
  gutter-md: "32px"
components:
  tile:
    backgroundColor: "{colors.night-tile}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  tile-lead:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.2xl}"
    padding: "32px"
  tile-lead-light:
    backgroundColor: "{colors.sumi-ink}"
    textColor: "{colors.paper-ground}"
    rounded: "{rounded.2xl}"
    padding: "32px"
  pill-primary:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "40px"
  pill-outline:
    backgroundColor: "transparent"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "40px"
  button-primary:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.night-ink-max}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.night-surface}"
  chip-tag:
    backgroundColor: "rgba(237, 237, 237, 0.10)"
    textColor: "{colors.night-ink-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    height: "26px"
  chip-filter-active:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "32px"
  input-search:
    backgroundColor: "{colors.night-ground}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.md}"
    padding: "6px 36px 6px 12px"
  nav-bar:
    backgroundColor: "rgba(10, 10, 10, 0.80)"
    textColor: "{colors.night-ink-secondary}"
    height: "56px"
---

# Design System: foxibu

## Overview

**Creative North Star: "The Quiet Evidence Board"**

A board of evidence set out in a quiet vitrine, labeled like a lab notebook. Each tile holds one checkable result: a project with its outcome and role, a named award, a looping competition clip. The interface itself is a neutral case of graded grays so the work (video, architecture figures, numbers) is the only thing with color or motion. Dates, years, and small labels are set in a monospace face, the way a notebook records when something was tried.

Density is low and calm. The home page ends in a handful of tiles rather than a scroll of sections; detail pages are a single readable column with figures framed in the same rounded tile language. Dark is the default world; light is the same system inverted, opted into by the visitor. Everything is flat and bordered rather than lifted. The one deliberate exception is the gallery, which keeps warm paper, masking tape, and tilted polaroids because it is a personal scrapbook, not part of the pitch.

Components are calm and precise: thin rules, no shadows at rest, hover darkens a border or a word instead of moving anything.

**Key Characteristics:**
- Achromatic gray ramp (Vercel-style steps); the accent is the ink color itself.
- Dark by default; light only when the visitor chooses it.
- Rounded bordered tiles (16px) on a 2-column / 4-column bento grid.
- IBM Plex Sans KR at two weights; IBM Plex Mono for years, dates, and labels.
- Color and motion come only from the work: muted looping clips, figures, photos.
- Gallery is the single warm, tactile exception.

## Colors

A strictly achromatic ramp in two mirrored sets (night for the default dark theme, paper/sumi for light); the only hues on the site belong to content, the gallery's tape, and the code-block slate.

### Primary
- **Night Ink / Sumi Ink** (`night-ink`, `sumi-ink`): body text, headings, and also the accent. Active nav links, primary pills, filter selection, blockquote and callout rules all use the ink color, so emphasis comes from weight, an arrow (↗, →), or inversion, never from a hue. Hover goes one step further to pure white (`night-ink-max`) or pure black (`sumi-ink-max`).

### Neutral
- **Night Ground / Paper Ground** (`night-ground`, `paper-ground`): the page background.
- **Night Tile / Paper Tile** (`night-tile`, `paper-tile`): the default tile face, one step off the ground.
- **Night Surface / Paper Surface** (`night-surface`, `paper-surface`): wells inside tiles, tag backgrounds, prose code containers, the dark-theme lead tile.
- **Night Rule / Paper Rule** (`night-rule`, `paper-rule`): every 1px border and divider.
- **Secondary Ink** (`night-ink-secondary`, `sumi-ink-secondary`): supporting lines, roles, nav links at rest.
- **Muted Ink** (`night-ink-muted`, `sumi-ink-muted`): mono labels, years, captions. The light value (#6b6b6b) is the palest gray that still clears 4.5:1 for 11–12px text on the tile face.

### Exceptions
- **Polaroid and Tape** (`paper-tape`, `night-tape`, `night-polaroid`): warm masking-tape and photo-border tones, used only in the gallery.
- **Code Slate** (`code-slate`): background of highlighted code blocks in both themes, because the syntax theme (Material Palenight) is a dark palette whose token colors need a dark ground.
- **Admin Danger** (`admin-danger`): destructive buttons in the admin only.

### Named Rules
**The Ink Is the Accent Rule.** There is no brand hue. Links, selection, and focus rings use the ink color; to bring back a hue, change only the three `--color-accent*` variables.

**The Content Owns Color Rule.** Hue on a page should come from a video, figure, or photo. If a new element needs color to be understood, redesign the element.

**The Alpha-as-Token Rule.** Translucent colors are defined as their own variables (`--color-bg-translucent`, `--color-text-soft`, `--color-accent-soft`); Tailwind opacity modifiers do not work on `var()` color tokens, and dividers that need translucency use `bg-current` + `opacity`.

## Typography

**Display Font:** IBM Plex Sans KR (with system-ui, sans-serif)
**Body Font:** IBM Plex Sans KR (with system-ui, sans-serif)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, monospace); JetBrains Mono for code

**Character:** One humanist sans for both Korean and Latin keeps the voice plain and factual. The mono face appears only on years, dates, tile labels, and code, as a notebook-like timestamp layer.

### Hierarchy
- **Display / Display Wide** (600, 2.5rem; 3.25rem at ≥1024px, 1.25): the profile name on the home tile, nowhere else.
- **Headline** (600, 2rem, 1.25, tight tracking): page titles (`.page-title`) and the lead project name.
- **Title** (600, 1.375rem wide tiles / 1.125rem narrow tiles, 1.375): project tile names; blog list titles at 1.125rem.
- **Body** (400, 1rem, 1.625): prose and detail text; project summaries capped at 68ch.
- **Body Lead** (400, 15px, 1.625): the admin-set headline under the profile name; the 15px wordmark in the header.
- **Body Small** (400, 0.875rem, 1.625): tile supporting lines, the skills line, meta.
- **Caption** (400, 13px, 1.5): roles, record counts ("수상 7 · 활동 7"), "view all →" links.
- **Label** (400, 0.75rem mono, muted): years, "latest", "more", "record" tile labels, figure captions.

### Named Rules
**The Two Weights Rule.** Only 400 and 600 of IBM Plex Sans KR are loaded (each Korean weight costs 200–580KB of glyph slices). `font-medium` is remapped to 600; `font-bold` and the 800 prose headings render as 600. Hierarchy must come from size, tracking, and ink step, never from a third weight. Plex Mono loads 400 and 500.

**The Keep-All Rule.** Korean wraps at word boundaries (`word-break: keep-all`, `overflow-wrap: break-word`). Separators (`·`) and label+value pairs are bound with non-breaking spaces so they never start a line.

## Layout

A bento grid on the home page: 2 columns below 1024px, 4 columns at ≥1024px, gaps of 12px (16px from 640px). The profile tile and the lead project tile each span 2 columns; at ≥1024px the lead tile spans 2 rows and the record tile (recent award names, counts as a caption) sits under the profile. Document order is profile → lead → record → secondary projects → more, so narrow screens read in the same order and tab order matches the wide layout. The page ends on work. Gallery, music, and books are not on the home page; they are reached only from the header menu.

Content pages use the same container: max-width 72rem (`max-w-6xl`), side gutters 16px (32px from 768px), vertical padding 32–56px. Detail pages are a single column: breadcrumb, a header closed by a 1px rule, then figures and video at full content width, with reading text capped near 68ch. The sticky header is 56px; skip-link targets get a 4rem scroll margin.

Breakpoints are Tailwind defaults (640 / 768 / 1024 / 1280). Layout must hold at 320–360px (Galaxy) with no horizontal scroll.

## Elevation & Depth

Flat by default. Depth is tonal: ground → tile (one gray step) → surface (another step), separated by 1px rules. The sticky header uses an 80% translucent ground with a medium backdrop blur. Shadows appear only on things that float above the page (modal, dropdown/search menus, the theme toggle knob) and on gallery polaroids.

### Shadow Vocabulary
- **Polaroid** (`box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08)`): gallery photo cards only.
- **Overlay** (Tailwind `shadow-lg` / `shadow-2xl`): modal panel and floating menus.

### Named Rules
**The Flat Tile Rule.** Tiles never carry a shadow and never lift on hover; hover changes the border to ink or the title to the max ink step.

## Shapes

Soft, consistent rounding. Tiles, figures, video frames, and the modal use 16px corners; video inside a tile uses 12px; buttons, inputs, and small controls use 6px; contact links, tags, filters, and toggles are full pills. Borders are always 1px in the rule color. The only non-orthogonal geometry is the gallery's per-photo tilt, which straightens on hover.

## Components

### Buttons
Calm and precise; color inversion carries the emphasis.
- **Shape:** gently rounded (6px).
- **Primary:** ink background, ground-colored text, 8px × 16px, 600 weight.
- **Hover / Focus:** background steps to max ink; focus shows a 2px ink ring.
- **Secondary:** transparent with a 1px rule border; hover fills with the surface gray.
- **Danger:** red, admin only.

### Contact Pills
- **Primary (email):** full pill, 40px tall, ink background with ground text; hover drops opacity to 85%.
- **Outline (GitHub, org, LinkedIn):** full pill, 1px rule border, ink text, trailing ↗; hover turns the border to ink.

### Chips
- **Tag:** full pill, 26px min height, faint ink wash (`--color-text-soft`), secondary ink text; hover to primary ink.
- **Category:** full pill with the accent-soft wash and ink text; hover adds an ink border.
- **Filter (gallery):** 32px pill; unselected has a rule border and secondary text, selected inverts to ink fill with ground text. Filters apply instantly.

### Cards / Containers (Tiles)
- **Corner Style:** 16px.
- **Background:** tile gray; inner wells use surface gray.
- **Shadow Strategy:** none (see The Flat Tile Rule).
- **Border:** 1px rule; linked tiles turn the border to ink on hover and show a 2px ink focus ring.
- **Internal Padding:** 24px; profile and lead tiles 32px (40px at ≥1024px).
- **Anatomy:** mono label (year or section) at top, title, supporting line, then a bottom row with the outcome (600) and role (13px secondary).

### Lead Project Tile (signature)
The one inverted tile. In light it is solid sumi ink with white text; in dark it is the surface gray (a full inversion would glare). Mono "latest" + year at top, project name as headline, then either a 16:9 muted looping video framed at 12px or a YouTube segment looping behind the tile, with a pause control that sits outside the link. A hairline divider (current color at 20% opacity) separates the outcome and role line. The whole tile is the link via a stretched `::after`.

### Inputs / Fields
- **Style:** 1px rule border, ground background, 6px corners, 12px text, muted placeholder, an inline submit icon button on the right.
- **Focus:** border turns ink; no glow.

### Navigation
Sticky 56px bar with a translucent ground, blur, and a bottom rule. Wordmark "foxibu" at 15px/600 beside the icon (inverted in dark). Links are 14px secondary ink; hover to primary; the active link is 600 in ink. A small bordered KO/EN toggle and the theme switch sit at the right. Below 768px the links collapse into a menu with 44px rows.

### Prose
Headings in ink, links underlined at 40% ink with a 3px offset (solid on hover), inline code on the accent-soft wash, blockquotes and callouts with a 3px ink left rule, toggles as bordered `<details>` with a rotating ▸.

## Do's and Don'ts

### Do:
- **Do** take every color from the gray ramp tokens; let videos, figures, and photos supply hue.
- **Do** keep dark as the default and test both themes, including Samsung Internet's forced dark.
- **Do** mark interactive emphasis with inversion, an arrow (↗ / →), 600 weight, or an ink border.
- **Do** set years, dates, and tile labels in IBM Plex Mono at 12px muted.
- **Do** build new tiles with the 16px corner, 1px rule border, and 24px padding.
- **Do** keep touch targets at least 40–44px for primary links and 24px for inline ones.

### Don't:
- **Don't** introduce a brand hue or colored tiles; earlier purple record tiles were deliberately removed.
- **Don't** request a third Plex Sans KR weight or rely on 700/800 to differ from 600.
- **Don't** add shadows or lift-on-hover to tiles or cards.
- **Don't** carry the gallery's paper, tape, or tilt into any other page.
- **Don't** use Tailwind opacity modifiers on token colors (`bg-accent/20`); define an alpha token instead.
- **Don't** put a default slogan or headline in the profile tile; it appears only when set in admin.
- **Don't** use a big numeral as a tile's content (the old "7 7" and "+13" tiles); name the results and keep counts as a 13px caption.
