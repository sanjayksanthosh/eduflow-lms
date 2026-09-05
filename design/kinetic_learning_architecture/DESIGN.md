---
name: Kinetic Learning Architecture
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#7b3300'
  on-tertiary: '#ffffff'
  tertiary-container: '#a04500'
  on-tertiary-container: '#ffd2bd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '800'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '800'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.6rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  stat-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.875rem
    fontWeight: '800'
    lineHeight: 2.25rem
    letterSpacing: -0.025em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-3xs: 0.125rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  space-4xl: 3rem
  space-5xl: 4rem
---

## Brand & Style

This design system establishes a high-clarity, optimistic, and highly structured workspace tailored for modern education workflows. The aesthetic merges corporate clarity with vibrant, purpose-driven kinetic accents, balancing dense administrative utility with friendly, motivating interfaces for learners and instructors.

### Core Tenets
- **Role-Centric Resonance:** Visual context shifts intentionally depending on the actor's primary locus:
  - **Administration:** Authoritative, high-density Indigo/Violet palette balanced with amber and rose priority triggers.
  - **Mentorship & Faculty:** Growth-oriented Emerald and Teal accents evoking mastery, assessment, and guidance.
  - **Learners & Students:** Motivating Electric Blue coupled with high-spirited Sunset Orange sparks for streaks, achievements, and active coursework.
- **Airy Rigor:** Interfaces leverage crisp whitespace, delicate border contours, and balanced micro-layouts to prevent visual cognitive overload during protracted grading or study sessions.
- **Optimistic Productivity:** System feedback relies on lively status indicators, compact progress visualizations, and distinct typographic hierarchy rather than intrusive, heavy decorations.

## Colors

The foundation is built on an ultra-clean Slate scale. System canvases default to pure white and subtle cool-slate tones, ensuring vibrant role-based accents retain focus without visual noise.

### Palette Architecture
- **Surface Foundations:**
  - Canvas Base: `#F8FAFC` (Slate 50)
  - Card & Container Surface: `#FFFFFF`
  - Elevated Popovers/Modals: `#FFFFFF`
  - Subdued Borders / Separators: `#E2E8F0` (Slate 200)
  - Subtle Insets & Row Hover: `#F1F5F9` (Slate 100)
- **Role Accents:**
  - **Admin Engine (Indigo/Violet):** Primary `#4F46E5`, Hover `#4338CA`, Wash/Muted `#EEF2FF`.
  - **Mentor Guidance (Teal/Emerald):** Primary `#0D9488`, Secondary `#10B981`, Wash/Muted `#F0FDF4`.
  - **Student Momentum (Blue/Amber/Orange):** Primary `#3B82F6`, Accent `#F97316`, Wash/Muted `#EFF6FF` and `#FFF7ED`.
- **Status & Feedback Tokens:**
  - **Active / Present / Complete:** `#10B981` (Emerald 500) | Surface: `#ECFDF5` | Text: `#065F46`
  - **Upcoming / Scheduled / In-Progress:** `#3B82F6` (Blue 500) | Surface: `#EFF6FF` | Text: `#1E40AF`
  - **Graded / Verified:** `#6366F1` (Indigo 500) | Surface: `#EEF2FF` | Text: `#3730A3`
  - **Pending / Warning / Late:** `#F59E0B` (Amber 500) | Surface: `#FFFBEB` | Text: `#92400E`
  - **Absent / Critical / Overdue:** `#EF4444` (Red 500) | Surface: `#FEF2F2` | Text: `#991B1B`

### Text Contrast Hierarchy
- Headings & Primary Metric Data: `#0F172A` (Slate 900)
- Secondary Body & Labels: `#475569` (Slate 600)
- Tertiary Metadata & Placeholder Text: `#94A3B8` (Slate 400)

## Typography

Plus Jakarta Sans powers all structural, contextual, and numerical data across this design system. Its geometric foundation provides warmth and energy, while refined optical tracking keeps dense academic records legible.

### Implementation Guidelines
- **KPIs & Metrics:** Use `stat-metric` paired directly with `label-xs` uppercase descriptors for summary headers.
- **Numbers in Tables:** Apply standard tabular numbers (`font-variant-numeric: tabular-nums`) to all grade, attendance, timestamp, and index columns to maintain vertical scanability.
- **Headings:** Headlines above `1.25rem` utilize tight negative tracking (`-0.01em` to `-0.03em`) to anchor dashboard sections.

## Layout & Spacing

The layout is built around a predictable 8pt baseline grid with an integrated 4pt micro-adjustment scale for dense controls and tabular interfaces.

### Grid & Breakpoints
- **Desktop (>= 1280px):** 12-column grid. Outer margins at `2rem`, gutters at `1.5rem`. Max container bounds capped at `1440px` for optimal data density without horizontal eye strain.
- **Tablet (768px - 1279px):** 8-column layout. Outer margins at `1.5rem`, gutters at `1rem`. Side navigation panels auto-collapse into icon rails or top header drawers.
- **Mobile (< 768px):** 4-column layout. Outer margins at `1rem`, gutters at `0.75rem`. Complex tabular views collapse into multi-line card representations.

### Spacing Philosophy
- **Component Padding:** Standard cards utilize `1.25rem` or `1.5rem` internal clearance. Compact dashboard widgets utilize `1rem`.
- **Data Densities:** Data table cells maintain `0.75rem` vertical padding for standard views, with an optional compact view utilizing `0.5rem`.

## Elevation & Depth

This system avoids heavy drop shadows and murky skeuomorphism in favor of clear boundary definitions and soft, diffused atmospheric lighting.

### Depth Stratification
- **Level 0 (Base Canvas):** `#F8FAFC`. Completely flat. Used as the canvas backing.
- **Level 1 (Surface Cards & Panels):** Pure `#FFFFFF` resting against `#F8FAFC`. Defined by a mandatory 1px border stroke (`#E2E8F0`) alongside a subtle ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Interactive Floating & Hover):** Lifted state for hovered cards and active modules. Shadow: `0 8px 16px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Dropdowns & Quick-Filters):** Contextual popups and command palettes. Outlined with `rgba(226, 232, 240, 0.8)` and shadowed with: `0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 6px 12px -6px rgba(15, 23, 42, 0.04)`.
- **Level 4 (Modals & Drawers):** High-impact operational overlays. Shielded with a backdrop blur overlay (`backdrop-filter: blur(4px); background-color: rgba(15, 23, 42, 0.4)`). Shadow: `0 20px 30px -10px rgba(15, 23, 42, 0.12)`.

## Shapes

The design system employs a refined modern curvature hierarchy. The base radius is defined at `0.5rem` (8px), with prominent parent containers stepping up to larger geometric arcs (`1rem` to `1.25rem`) to project a polished, contemporary feel.

### Corner Radius Mapping
- **Pills / Status Chips / Avatars:** Full continuous round (`9999px`).
- **Standard Controls (Inputs, Buttons, Dropdowns):** `0.5rem` (8px).
- **Cards & Data Modules:** `1rem` (16px) or `1.25rem` (20px).
- **Modals & Slide-out Drawers:** `1.25rem` (20px).

## Components

### Buttons
- **Primary:** Role-dependent background (Indigo for Admin, Teal for Mentor, Electric Blue for Student), white text, `0.5rem` radius, bold text (`label-lg`). Hover shifts down one tone (e.g., `#4F46E5` -> `#4338CA`) with subtle `Level 2` elevation lift.
- **Secondary / Soft:** Tone-tinted background (e.g., `#EEF2FF` for Admin), corresponding text (`#4F46E5`), borderless.
- **Outline:** Transparent background, 1px solid `#E2E8F0`, `#0F172A` text, hover with Slate 50 tint.

### Status Pills & Badges
- **Structure:** `label-xs` uppercase typography with `letter-spacing: 0.04em`, 4px vertical by 10px horizontal padding, pill-shaped (`9999px`).
- **Color Pairs:**
  - *Active / Present:* `#ECFDF5` background, `#065F46` label.
  - *Upcoming / In-Progress:* `#EFF6FF` background, `#1E40AF` label.
  - *Graded:* `#EEF2FF` background, `#3730A3` label.
  - *Late / Pending:* `#FFFBEB` background, `#92400E` label.
  - *Absent / Missed:* `#FEF2F2` background, `#991B1B` label.
- Optional 6px pulsing indicator dot placed leading the text label for real-time states.

### Data Tables
- **Container:** Enclosed in `Level 1` card with `1rem` corner rounding.
- **Header:** Background `#F8FAFC`, uppercase `label-xs` text, height `40px`, bottom border 1px solid `#E2E8F0`.
- **Rows:** Alternating rows avoided; rely on 1px `#F1F5F9` row dividers. Row hover triggers `#F8FAFC` transition.
- **Columns:** Standard padding `0.75rem` vertical, `1rem` horizontal. Fixed column support for student identities with persistent avatars.

### Stat Cards & Progress Modules
- **Metric Cards:** Padding `1.25rem`, structured with a top row containing title and contextual icon badge, a middle row presenting the `stat-metric` number, and a bottom row housing a mini trend badge (+4.2% pill) or sparkline.
- **Progress Bars:** Base track height of `6px` or `8px`, track color `#E2E8F0`, rounded-full. Fill utilizes vibrant gradients matching the operational role (e.g., Electric Blue `#3B82F6` into Teal `#10B981`).

### Form Controls & Filters
- **Inputs & Selects:** Height `40px`, border 1px solid `#E2E8F0`, text color `#0F172A`, placeholder `#94A3B8`. Focus state applies a 2px outer ring in the active role color with zero offset.
- **Quick-Filter Bars:** Horizontal flex containers wrapping filter chips, search input with embedded search icon, and a count tally badge. Active filters switch from an outline pill to a solid role-colored pill with a trailing dismissal 'x'.

### Schedule Timelines
- Vertical rhythm using a continuous 2px `#E2E8F0` track line. Event nodes anchor with an 8px circular node colored according to the activity status. Time markers sit on the left in `label-md` Slate 500, with lecture/assignment cards offset on the right.