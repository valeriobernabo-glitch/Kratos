# Design System Document: Neon Amethyst Executive Guidelines

## 1. Overview & Creative North Star: "The Crystalline Logic"
This design system moves away from the rigid, boxy constraints of traditional Warehouse Management Systems (WMS) to embrace **Crystalline Logic**. The goal is to transform complex logistical data into a high-end, editorial experience that feels like a futuristic command center.

The "Creative North Star" is **Refractive Clarity**. We achieve this through:
*   **Intentional Asymmetry:** Breaking the 12-column grid with hero elements that bleed off-canvas or overlap containers.
*   **Crystallized Depth:** Using transparency and light refraction rather than solid shapes to define space.
*   **Vibrant Precision:** Utilizing the high-energy `primary` purple and `tertiary` pinks to highlight critical data paths amidst a sea of calm, off-white surfaces.

## 2. Colors & Atmospheric Layers
Our palette is not just a set of fills; it is a system of light and glass.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. Boundaries must be defined through background color shifts. To separate a sidebar from a main stage, place a `surface-container-low` panel against a `background` floor. The eye should perceive the edge through the change in tone, not a physical line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, translucent layers. 
*   **Base Layer:** `surface` (#f5f7f9) serves as the foundation.
*   **Intermediate Panels:** Use `surface-container-low` for large content areas.
*   **Elevated Focus:** Use `surface-container-lowest` (#ffffff) for high-priority cards to create a natural, "raised" appearance.
*   **Nested Elements:** Use `surface-container-high` or `highest` for inner elements like search bars or data chips to "recess" them into the parent panel.

### The "Glass & Gradient" Rule
To achieve the "Neon Amethyst" signature, floating elements (modals, dropdowns, hovered cards) must use Glassmorphism:
*   **Fill:** `surface_container_lowest` at 60%–80% opacity.
*   **Effect:** `Backdrop-blur` (16px to 32px).
*   **Soul:** Apply a linear gradient (45°) from `primary` (#6a37d4) to `tertiary_fixed` (#ff8bc5) for main CTAs and "Live Status" indicators to provide a sense of kinetic energy.

## 3. Typography: The Editorial Edge
We use a high-contrast typographic pairing to balance futuristic tech with human readability.

*   **Display & Headlines (Space Grotesk):** This is our "Futuristic" voice. Use `display-lg` and `headline-lg` with tight letter-spacing (-2%) for hero metrics and dashboard titles. Its geometric construction mirrors the precision of a warehouse.
*   **Body & Labels (Manrope):** This is our "Functional" voice. Manrope provides excellent legibility at small sizes (`body-sm`, `label-sm`). 
*   **Editorial Hierarchy:** Use `primary` or `tertiary` color tokens for `label-md` to categorize data, making the text itself act as a decorative element.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and light simulation, never through "drop-shadow" presets.

*   **The Layering Principle:** Stack `surface-container-lowest` cards on `surface-container-low` backgrounds. This creates a soft, organic lift that feels premium.
*   **Ambient Shadows:** If a floating element requires a shadow, it must use the `on-surface` color at 4% opacity with a blur of 40px and a Y-offset of 20px. It should look like a soft glow of shadow, not a hard edge.
*   **The "Ghost Border" Fallback:** If a container requires further definition (e.g., a search input), use the `outline-variant` token at **15% opacity**. 100% opaque borders are strictly forbidden.
*   **Refractive Edge:** For glass panels, use a 1px inner-glow/border using `surface_container_lowest` at 40% opacity to simulate the edge of a cut crystal.

## 5. Components

### Buttons
*   **Primary:** A vibrant gradient of `primary` to `primary_container`. No border. `xl` (1.5rem) roundedness.
*   **Secondary:** `surface_container_high` background with `primary` text.
*   **Tertiary:** Transparent background, `primary` text, with a subtle `primary` underline on hover.

### Input Fields
*   **Style:** Use `surface_container_low` for the field fill. No border.
*   **Focus State:** Transition the background to `surface_container_lowest` and add a subtle 2px soft glow using `primary_fixed_dim` at 30% opacity.

### Cards & Lists
*   **Rule:** Forbid all divider lines.
*   **Spacing:** Use the `xl` (1.5rem) spacing scale to separate list items.
*   **Contextual Shift:** When hovering over a list item, shift the background to `surface_container_highest` to indicate selection.

### Navigation (Glass Sidebar)
The sidebar should be a full-height glass panel using `surface_container_low` at 70% opacity with a heavy backdrop blur. Active states should be indicated by a `tertiary` vertical "shimmer" or a soft gradient pill behind the icon.

## 6. Do's and Don'ts

### Do:
*   **DO** use whitespace as a structural tool. Let the data breathe.
*   **DO** use `tertiary` (Pink/Lavender) sparingly for "Success" or "New" states to maintain its impact.
*   **DO** ensure all text on `primary` surfaces uses the `on_primary` (#f8f0ff) token for high-end legibility.

### Don't:
*   **DON'T** use pure black (#000000) for text. Always use `on_surface` (#2c2f31).
*   **DON'T** use standard Material Design "elevated" shadows. They feel too "off-the-shelf" for this system.
*   **DON'T** use 100% opaque containers for overlays; always lean into the glassmorphism/translucency tokens.