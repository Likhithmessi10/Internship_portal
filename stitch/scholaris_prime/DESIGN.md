# Design System Strategy: The Scholarly Monolith

## 1. Overview & Creative North Star
The design system for the PRTI Admin Portal is guided by the Creative North Star: **"The Scholarly Monolith."** 

In an era of cluttered, "template-first" dashboards, this system seeks to communicate authority and intellectual rigor through extreme structural clarity and an editorial aesthetic. We are moving away from the "standard" admin look—characterized by heavy borders and flat grey boxes—and moving toward a layered, intentional experience.

By utilizing **tonal depth** and **asymmetric balance**, we treat data not as a chore to be managed, but as a prestigious archive to be curated. The interface should feel like a high-end digital library: quiet, sturdy, and profoundly efficient. We use breathing room (white space) as a functional tool to reduce cognitive load for researchers dealing with complex datasets.

## 2. Colors: Tonal Architecture
The palette is rooted in deep academic blues and slate neutrals, designed to evoke trust. However, the execution must remain modern and light.

### Tonal Application
*   **Primary (#001e40):** Reserved for high-level brand moments and core CTAs. Use this to anchor the eye.
*   **Surface Hierarchy:** Instead of a flat background, use the `surface-container` tiers to create a "stacked paper" effect.
    *   **Main Page Background:** `surface` (#f7f9fb).
    *   **Main Navigation Sidebar:** `surface-container-low` (#f2f4f6).
    *   **Content Cards:** `surface-container-lowest` (#ffffff).
*   **The "No-Line" Rule:** We do not use 1px solid borders to define sections. Borders create visual noise. Instead, separate complex data sections by shifting the background color. A data table should sit on `surface-container-lowest`, while the page section it belongs to sits on `surface`.
*   **The "Glass & Gradient" Rule:** To provide "soul" to the portal, floating elements like dropdown menus or toast notifications must use a Glassmorphic approach: `surface-container-lowest` at 80% opacity with a `backdrop-blur` of 12px. 
*   **Signature Textures:** For primary actions, apply a subtle linear gradient from `primary` (#001e40) to `primary_container` (#003366) at a 145-degree angle. This adds a "premium weight" to buttons that flat colors lack.

## 3. Typography: The Editorial Scale
We use **Inter** as our typographic workhorse. The goal is to make data look like a premium research journal.

*   **Display & Headline:** Use `display-md` for high-level aggregate numbers (e.g., total funding). This communicates the "Monolith" scale—bold, authoritative, and unmissable.
*   **Body & Titles:** `title-md` and `body-md` are for standard data entry and reading. Ensure line-height is generous (1.5x) to prevent "data fatigue."
*   **Labels:** Use `label-sm` in all-caps with a `0.05rem` letter-spacing for table headers and metadata. This differentiates "system text" from "user data" instantly.

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows are a last resort. Depth is achieved through layering and "Atmospheric Perspective."

*   **The Layering Principle:** Treat the UI as physical layers of fine paper. An "Active" research card should be `surface-container-lowest` (pure white) sitting on a `surface-container-low` background. The slight shift in hex value provides a cleaner separation than any border.
*   **Ambient Shadows:** When an element must float (like a modal), use a wide-spread, low-opacity shadow. 
    *   *Blur:* 32px, *Opacity:* 6%, *Color:* `on_surface` (#191c1e). This creates a soft, natural lift rather than a harsh artificial drop-shadow.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in high-density data tables, use a **Ghost Border**: `outline-variant` (#c3c6d1) at 20% opacity. It should be felt, not seen.
*   **Glassmorphism:** Use `surface_tint` at 5% opacity for the sidebar background to allow the brand colors to bleed through subtly, grounding the navigation in the portal’s environment.

## 5. Components: Precision Primitives

### Cards & Lists
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use the **Spacing Scale (4 or 5)** to create a vertical rhythm. Let the alignment of text create the "invisible line" that the eye follows.
*   **Nesting:** High-priority research metrics should be housed in cards with an **8px (DEFAULT)** corner radius and a `surface-container-lowest` fill.

### Buttons
*   **Primary:** Gradient fill (Primary to Primary-Container), white text, 8px radius.
*   **Secondary:** No fill. `outline-variant` Ghost Border (20% opacity). On hover, transition to `surface-container-high`.

### Input Fields
*   **Style:** Avoid the "white box with a black border." Use `surface-container-high` as the fill color with a Ghost Border. When focused, the border should transition to `primary` with a 2px thickness.

### Chips (Data Tags)
*   **Status Chips:** Use low-saturation backgrounds. For success, use a pale green with `on-success` text. Never use "vibrant" or "neon" colors; keep them muted to maintain the professional, research-focused tone.

### Navigation Sidebar
*   **Visual Style:** Full height, `surface-container-low` background. Use a `3.5rem (16)` spacing for the left margin of nav items to create a strong, asymmetric "Editorial" gutter.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a wide data column next to a thin "Summary" column) to break the "standard dashboard" grid.
*   **Do** use `headline-lg` for empty states to make them feel like intentional design choices rather than missing data.
*   **Do** use `surface-container` shifts to group related research parameters.

### Don't
*   **Don't** use 1px solid black or dark grey borders. They "trap" the data and make the portal feel dated.
*   **Don't** use standard "Drop Shadows." Only use the Ambient Shadow specification.
*   **Don't** crowd the interface. If a table has 20 columns, use a horizontal scroll on a `surface-container-lowest` sheet rather than shrinking the font size. Readability is the priority.