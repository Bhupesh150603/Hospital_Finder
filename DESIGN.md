# Emergency Care Wayfinding — Design System

This design document outlines the visual language, design tokens, component specifications, and interaction patterns for **Hospital Finder**, extracted directly from the Stitch MCP project *Emergency Hospital Finder* (`projects/16008072045790501273`).

---

## 1. Brand & Visual Philosophy

The design system is engineered for high-stress critical decisions under varying connectivity, sunlight, and emotional strain. It draws inspiration from institutional hospital wayfinding systems, emergency triage signage, and utilitarian municipal dispatch interfaces.

### Core Principles
- **Calm Under Duress:** Visual noise is stripped away. Essential clinical metrics stand out through deliberate typographic weight, crisp boundaries, and familiar spatial order.
- **Wayfinding Utilitarianism:** High contrast, structural lines, and unambiguous state definitions derived from civic signage.
- **Strict Visual Restraint:** Colors denote functional realities (triage states, physical actions), never decoration. Soft gradients, glassmorphism, glowing ambient lights, and marketing banners are strictly prohibited.
- **No Decorative Placeholders:** UI elements focus on rapid scannability and actionable data density (ICU bed count, ETA, oxygen status, emergency dispatch line).

---

## 2. Design Tokens

### Color Palette

#### Core & Canvas Roles
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `canvas-base` | `#FAFAF8` | Organic linen-tinted clinical off-white backdrop |
| `surface-plain` | `#FFFFFF` | Interactive cards, tiles, modal containers, and elevated sheets |
| `primary` | `#1D4E89` | Institutional authority, primary actions, navigation, & operational headers |
| `primary-dark` | `#00376C` | High-contrast text on primary containers and active states |
| `emergency-accent` | `#E8553A` | Immediate emergency dispatch (108 / 102), SOS triggers, trauma alerts |
| `ink-primary` | `#1C1F26` | High-density charcoal neutral for primary labels & headers |
| `ink-muted` | `#585E6C` | Subordinate metadata, disclaimers, & contextual timestamps |
| `border-structural` | `#D5D5CD` | 1px solid structural boundary line for cards & inputs |
| `border-subtle` | `#EAEAE4` | Internal card dividers & grid separators |

#### Triage & Operational Status Spectrum
| Status State | Text / Icon Hex | Background Hex | Usage Condition |
| :--- | :--- | :--- | :--- |
| **Available** | `#2F855A` | `#EBF7EE` | Beds/ICU/Oxygen confirmed available within 15 mins |
| **Limited** | `#B7791F` | `#FEF6E7` | Constrained capacity, queue or wait time expected |
| **Full / Divert** | `#C53030` | `#FDF0F0` | Zero operational capacity, pediatric ICU full, trauma bay divert |

---

## 3. Typography System

**Primary Font Family:** `Public Sans`, sans-serif  
Prioritizes uncompromised legibility, rapid scannability, and structural weight differentiation under crisis.

### Rules of Execution
- **Weight-Driven Hierarchy:** Information levels parse by weight shifts (`400` body, `500` secondary label, `600` subhead, `700` primary status/metric) rather than extreme size scaling.
- **Natural Case Only:** Avoid all-caps badge tracking or letter-spaced text, which degrades instant reading comprehension.
- **Tabular Figures:** All bed counters, travel times (ETA), and phone numbers use proportional/tabular metrics to prevent layout jitter during live updates.

### Type Scale
| Token | Font Size | Line Height | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `headline-xl` | `2.25rem` (36px) | `2.75rem` | 700 (Bold) | Main screen hero titles (Desktop) |
| `headline-xl-mobile` | `1.75rem` (28px) | `2.25rem` | 700 (Bold) | Main screen hero titles (Mobile) |
| `headline-lg` | `1.5rem` (24px) | `2.0rem` | 700 (Bold) | Facility headers & modal titles |
| `headline-lg-mobile` | `1.25rem` (20px) | `1.75rem` | 700 (Bold) | Mobile facility section headers |
| `headline-md` | `1.125rem` (18px) | `1.5rem` | 600 (SemiBold) | Card titles, section headers |
| `headline-sm` | `1.0rem` (16px) | `1.375rem` | 600 (SemiBold) | Subsection headers, key metrics |
| `body-lg` | `1.125rem` (18px) | `1.625rem` | 400 (Regular) | Primary descriptions |
| `body-md` | `0.9375rem` (15px) | `1.375rem` | 400 (Regular) | Default body text & facility details |
| `body-sm` | `0.8125rem` (13px) | `1.125rem` | 400 (Regular) | Subtext, timestamps, disclaimers |
| `label-lg` | `0.9375rem` (15px) | `1.25rem` | 600 (SemiBold) | Button labels, active tab items |
| `label-md` | `0.8125rem` (13px) | `1.125rem` | 500 (Medium) | Input labels, table headers |
| `label-sm` | `0.6875rem` (11px) | `0.875rem` | 600 (SemiBold) | Triage status badges, micro tags |

---

## 4. Spacing, Shapes & Elevation

### Spacing Scale
| Token | Size | Purpose |
| :--- | :--- | :--- |
| `space-xs` | `0.25rem` (4px) | Micro gaps between inline metrics and icons |
| `space-sm` | `0.5rem` (8px) | Inner badge padding, button icon gaps |
| `space-md` | `0.75rem` (12px) | Compact card internal padding, list item gaps |
| `space-lg` | `1.0rem` (16px) | Standard container margins, card gaps |
| `space-xl` | `1.5rem` (24px) | Section separation, desktop layout grid gutters |
| `gutter` | `0.75rem` (mobile) / `1.5rem` (desktop) | Grid layout column gaps |
| `margin` | `1.0rem` (mobile) / `2.0rem` (desktop) | Page outer boundary margin |

### Shapes & Corner Radii
- `sm`: `0.125rem` (2px)
- `DEFAULT`: `0.25rem` (4px) — Standard inputs, buttons, badges
- `md`: `0.375rem` (6px)
- `lg`: `0.5rem` (8px) — Cards, facility containers
- `xl`: `0.75rem` (12px) — Bottom sheets, major dialogs
- `full`: `9999px` — Strictly limited to circular icon avatars (pill buttons are forbidden)

### Elevation Tiers
- **Tier 0 (Base Canvas):** `#FAFAF8` — Flat canvas, zero elevation.
- **Tier 1 (Facility Cards & Modules):** `#FFFFFF` fill bounded by `1px solid #D5D5CD` with a crisp shadow: `box-shadow: 0 1px 2px rgba(28, 31, 38, 0.05)`.
- **Tier 2 (Sticky Headers & Filters):** `#FFFFFF` fill bounded by baseline border `1px solid #D5D5CD`.
- **Tier 3 (Emergency Trays & Overlays):** `#FFFFFF` fill with structural border `1px solid #1C1F26` and sharp shadow: `box-shadow: 0 4px 12px rgba(28, 31, 38, 0.12)`.

---

## 5. Component Specifications & Patterns

### 1. Buttons
- **Emergency Action (SOS / Call ER):**
  - Background: `#E8553A` (Coral Red)
  - Text: `#FFFFFF`, Weight 700
  - Min Height: `48px` (High tactile accuracy under stress)
  - Border: None
- **Primary Action (Directions / Filter):**
  - Background: `#1D4E89` (Primary Blue)
  - Text: `#FFFFFF`, Weight 600
  - Border: `1px solid #1D4E89`
- **Secondary / Outlined Action:**
  - Background: `#FFFFFF`
  - Text: `#1C1F26`
  - Border: `1px solid #D5D5CD`
  - Active Press: `#FAFAF8`

### 2. Triage Status Badges
- **Available:** Background `#EBF7EE`, Text `#2F855A`, Border `1px solid #2F855A`
- **Limited:** Background `#FEF6E7`, Text `#B7791F`, Border `1px solid #B7791F`
- **Full / Divert:** Background `#FDF0F0`, Text `#C53030`, Border `1px solid #C53030`
- **Rule:** Badges must rely on static 600-weight text and 1px borders. Pulsing dots, neon glows, or decorative icons inside badges are not allowed.

### 3. Facility Card Structure
Each hospital card features 3 dedicated sections separated by hairline dividers (`1px solid #EAEAE4`):
1. **Header Zone:** Facility name, accreditation grade (e.g. NABH/NABL), distance/ETA metric.
2. **Triage Metric Row:** 3 to 4 metric boxes (Oxygen, ICU, Emergency Ward, Ventilator) displaying real-time capacity and color-coded triage status.
3. **Direct Action Footer:** Split buttons for Primary Navigation (Directions in Blue) and Immediate ER Call Line.

### 4. Search & Filter Bar
- Background `#FFFFFF`, border `1px solid #D5D5CD`, radius `4px`.
- Focus State: `2px solid #1D4E89` with zero-offset outline.
- Features persistent location indicators and instantaneous clear triggers.

### 5. Iconography Rules
- Clean 2px stroke line icons (e.g. Lucide / Feather family) set to 20px / 24px bounding box.
- Icons are monochromatic matching the text color of the parent container. Emoji characters are strictly banned from UI labels, feedback toasts, and notification alerts.
