# Prompt: Interactive Wedding Invitation Website

Copy everything below into a fresh agent session to recreate this project from scratch.

---

## Goal

Build a three-page, interactive wedding invitation website. Pure HTML/CSS/JS — no framework, no build step, no backend. Must run by opening the files directly (or via any static file server) and be deployable to GitHub Pages with a plain `git push`.

The experience is a **branching journey**, not a single scroll:

1. **Landing page** — the couple's names over a real photo of a temple complex at dusk, with two doorways to choose from: "Wedding Ceremony" and "Reception".
2. **Wedding page** — clicking "Wedding Ceremony" leads to a photorealistic South Indian temple gopuram (tower). The visitor touches a pair of carved wooden doors set into the base of the tower; the doors swing open with a real-time animation and reveal the traditional wedding invitation.
3. **Reception page** — clicking "Reception" leads to a completely different visual world: modern glass double doors in a gold frame, lit by bokeh lights and spotlights, evoking a contemporary event entrance. Touching the doors slides them apart to reveal a sleek, modern reception invitation card.

The two "worlds" (temple vs. modern event) should look and feel deliberately different from each other — different color palettes, different door mechanics (hinge-swing vs. slide-apart), different card styling — while sharing the same typography system and couple identity so they clearly belong to one site.

## Content (use exactly this data)

```
Groom:  Shankar Prasad K  (Selvan · Manager, Deloitte Chennai)
Bride:  Haripriya V       (Selvi · Senior HR, eClerx, Coimbatore)
        D/o Mr. V. Venkatesh (Late) – Mrs. V. Shanthi

Hosts:  Mrs. Devi Kumaravel & Mr. V. Kumaravel

Wedding ceremony (Subha Muhurtham):
  Friday, 20th November 2026, 6:00 AM – 7:30 AM
  Venue: Sri Aadhi Sivalayam · Murugan Sannidhanam
  Address: Near Vinayagapuram K.G. Bakery Bus Stop, Sivaram Nagar, Coimbatore
  Map: https://share.google/5LpDdYQeVHZ9qTApS

Reception:
  Friday, 20th November 2026, 6:00 PM – 9:00 PM
  Venue: GP Grand Galaxy
  Address: Near G.P. Signal, Ganthipuram, Sathy Road, Coimbatore
  Map: https://share.google/MLjErDc9WtHHSo3wP

Full schedule:
  Betrothal   — 18 Nov 2026 (Wed) · 4:30 – 6:00 AM
  Muhurtham   — 20 Nov 2026 (Fri) · 6:00 – 7:30 AM
  Reception   — 20 Nov 2026 (Fri) · 6:00 PM onwards

Closing line on every card: "With best compliments from Friends & Relatives"

RSVP contact: WhatsApp number 919840454710 (already printed on the couple's
physical invitation card, so it's the correct number to reuse)

Sacred invocation line on the wedding card (Tamil):
  "ஸ்ரீ பச்சையம்மன் துணை · ஸ்ரீ முருகன் துணை"
Wedding heading in Tamil: "திருமண விழா அழைப்பிதழ்"
Reception heading in Tamil (optional, English is primary on that page):
  "திருமண வரவேற்பு"
```

**Important — this is a Tamil Hindu wedding, not a generic North Indian one.**
Do not use the 🕉 emoji anywhere — it reads as a generic/Hindi symbol and is
out of place. Use the actual Tamil Unicode character **ௐ** (U+0BD0, TAMIL OM)
instead, styled as text (gold gradient, serif font), not as an emoji.

## Design language

**Shared across all pages:**
- Fonts (Google Fonts): `Great Vibes` (cursive, for the couple's names),
  `Cormorant Garamond` (serif, for body text — weights 300/400/600, italic
  variants too), `Cinzel` (serif, for small-caps engraved-style labels like
  section headings and buttons — weights 400/500/600).
- Gold (`#D4AF37` and lighter `#F5D078` / `#E8C39E`) as the one shared accent
  color across every page, against otherwise very different palettes.
- Every interior/detail card gets a thin gold border, an inset second border
  a few pixels in for a "double frame" look, and text-align: center.

**Landing page (`index.html`):**
- Full-bleed real photo background of a temple complex at golden-hour
  sunset (wide shot, multiple gopurams, a reflecting tank/pool in the
  foreground looks best). Slow "Ken Burns" zoom (scale 1 → ~1.1 over
  30+ seconds, ease-in-out, alternate direction).
- Dark gradient overlay (vertical, darker at top and bottom, lighter in a
  band through the middle) so the text stays legible against the sky.
- Small drifting gold sparkle particles on a canvas layer above the photo.
- Centered content: the Tamil ௐ glyph, an eyebrow line ("Together with
  their families"), the couple's names in huge `Great Vibes` script with a
  gold gradient fill (`background-clip: text`) and an italic "&" between
  them, then the date/location line, then two side-by-side glassmorphic
  cards ("Wedding Ceremony — The Sacred Rites" / "Reception — An Evening
  Celebration"), each with a small line-art SVG icon (a stepped
  gopuram-silhouette icon for the wedding card, a champagne-coupe icon for
  the reception card), that link to `wedding.html` and `reception.html`.
  Cards lift and glow gold on hover; on narrow screens they stack instead
  of sitting side by side.

**Wedding page (`wedding.html`) — read this section carefully, it's the
hardest part to get right:**

The instinct is to build the temple tower as an SVG/CSS illustration. **Do
not do this** — a hand-drawn South Indian gopuram cannot approach
photographic realism; it will read as a flat vector icon no matter how much
detail you add, and it will look worse, not better, the more "hyper
realistic" you're asked to make it.

Instead:
1. Source a **real, high-resolution, freely-licensed photograph** of an
   actual gopuram — Wikimedia Commons has many (search for "Madurai
   Meenakshi Amman Temple gopuram" or similar; filter for CC-BY-SA or
   public domain, and pick the highest resolution, most front-on shot you
   can find with rich, colorful sculptural detail). Download it, crop out
   any distracting real-world elements near the bottom (signage, power
   lines, tourist clutter, parked vehicles) so you're left with clean tower
   and sky, and re-save at a web-friendly size (~1800px wide, JPEG quality
   ~80). **Note the photographer's name and license** — you'll need to
   credit it in a README if the site is ever shared broadly.
2. Lay the page out as a flex column: the photo fills the top ~70% of the
   viewport (`object-fit: cover`, anchored to the bottom so the base of the
   tower is visible), and a "doorway band" of fixed height (`clamp(280px,
   34vh, 430px)`) sits below it holding a built stone doorway with
   interactive wooden doors.
3. **The key trick that makes the photo and the built doorway sit together
   convincingly: don't try to make the illustrated doorway as bright and
   detailed as the photo — make it dark instead.** At dusk, the top of a
   tower catches the light; the entrance at ground level sits in deep
   shadow, lit only by whatever lamps are actually there. Lean into that:
   - Apply a warm color-grade to the photo itself (CSS `filter: saturate()
     contrast() brightness(0.88) sepia(0.12) hue-rotate(-6deg)` roughly),
     plus a multiply-blended gradient overlay that shifts its sky from
     daytime blue toward dusk purple/orange, darkening toward the bottom
     edge.
   - Fade the very bottom of the photo to near-black so it dissolves into
     the doorway band below (a `linear-gradient` overlay, transparent →
     the exact background color the doorway band starts with).
   - Make the doorway band's own background very dark (near-black warm
     brown, e.g. `#1a0d05` → `#0c0603`), and apply `filter: brightness(0.35
     – 0.46)` to the stone pilasters/lintel and the wooden doors themselves.
   - Add two small animated oil-lamp flames (simple CSS shapes: a stem, a
     bowl, a flickering flame with `box-shadow` glow) flanking the doors at
     the base, plus a soft warm radial-gradient "lamp pool" of light washing
     up onto the doors near each lamp. This localized warm light against
     the surrounding darkness is what makes it read as "real wood in
     lamplight" instead of "flat illustration."
4. **Texture the doors and stone procedurally, not with flat CSS
   gradients.** Write a small canvas function that generates a wood-grain
   texture: a base brown gradient, a dozen or so horizontal "plank seam"
   lines, 60–80 randomly-curved grain streaks drawn with `multiply` blend
   mode, then per-pixel random noise added via `getImageData` for fine
   grain, then a grid of brass "studs" drawn as small radial gradients
   (bright highlight, dark rim) on top. Do the same idea for a sandstone
   texture (base gradient + per-pixel noise + faint horizontal block
   lines) for the pilasters and lintel. Convert each canvas to a data URL
   with `toDataURL()` and set it as the element's `background-image`. This
   reads as genuinely textured/photographic-adjacent in a way flat
   gradients never do.
5. **The door-opening interaction should be a real, custom-built
   animation, not a bare CSS transition.** Structure:
   - Two door leaves, each `position: absolute; width: 50%`, inside a
     parent with `perspective: 800px`. Each leaf has
     `transform-style: preserve-3d` and a `transform-origin` on its outer
     hinge edge. Add the `open` class on click to rotate them
     (`rotateY(-80deg)` / `rotateY(80deg)`) via a CSS transition — that part
     alone is fine to let CSS handle.
   - In parallel, run your own `requestAnimationFrame` loop for the same
     duration (~1.5s) that: sweeps a highlight gradient across each door
     face (drive a CSS custom property like `--hl` from 12% to ~84% with an
     ease-out curve, used in a `linear-gradient` on an overlay div with
     `mix-blend-mode: overlay`); grows a vertical warm light-shaft in the
     gap between the doors (width 0 → ~45%, blurred, `mix-blend-mode:
     screen`); and spawns small warm dust/light-mote particles on a small
     canvas overlaid on the door area, drifting upward and fading.
   - On completion: trigger a brief "impact" — a 400ms CSS keyframe shake
     (a few pixels of alternating translate) on the doorway band, plus a
     burst of ~14 dust particles — then cross-fade to the invitation scene.
   - Respect `prefers-reduced-motion`: if set, skip straight to the
     revealed scene with no animation.
   - Make the door hit-area keyboard operable: `role="button"
     tabindex="0"`, an `aria-label`, and a `keydown` listener that treats
     Enter/Space the same as a click. Give it a visible `:focus-visible`
     outline.
6. Add a handful of small CSS-animated twinkling stars and a soft glowing
   moon positioned over the open-sky portions of the photo (top corners),
   and a light canvas-based petal-drift overlay for ambience.
7. Behind the doors: a warm, dim invitation scene (deep maroon/near-black
   gradient background, a flickering lamp-glow + incense-smoke canvas
   ambience) holding the invitation card itself — the Tamil ௐ glyph, the
   Tamil invocation line, "WEDDING INVITATION" in `Cinzel` small-caps, the
   hosts' names, both names in large gold `Great Vibes` script (groom then
   "with" then bride), roles, date/time block, venue block with a
   "📍 Get Directions" link, and the closing line. Below the card: action
   buttons (see Shared Features below) and simple nav links back Home and
   across to the Reception invitation.

**Reception page (`reception.html`):**

This one is fully illustrated (no photo needed — there's no single iconic
real place to photograph, so a well-crafted illustration reads as
intentional rather than "not quite photoreal"). Near-black background.
Build:
- Two thin uplit pillars flanking the doorway, each topped with a small
  cluster of pale flower-bloom shapes (little radial-gradient circles
  arranged in a ring), lit from below by a soft warm radial glow.
- A pair of modern **glass** double doors in a slim gold frame: each leaf
  is a semi-transparent diagonal-streaked gradient (simulating glass
  reflections) over a warm glow that shines through from behind, with a
  thin vertical gold bar as a handle. A row of small warm "marquee" bulbs
  blinking in sequence along the top edge of the frame. A carpet-shaped
  gradient trapezoid on the floor leading to the doors. Two soft diagonal
  "spotlight beam" gradients crossing the scene from the top corners.
- A canvas layer of large, soft, slow-drifting warm bokeh circles
  (blurred-looking radial gradients, varied size/opacity) rather than the
  temple page's petals — this is what visually signals "modern event"
  rather than "temple."
- Interaction: clicking/touching the door frame **slides** the two glass
  leaves apart horizontally (`translateX`) rather than hinge-swinging them
  — a deliberately different mechanic from the temple doors, reinforcing
  that this is a different kind of space. Same keyboard-accessibility and
  reduced-motion treatment as the temple doors.
- Reveals a sleek modern card: near-black background, thin gold border,
  "You Are Cordially Invited" eyebrow, "Wedding Reception" in gold
  `Great Vibes` script, both names, date/time, venue with a directions
  link, and a compact schedule table (event name in gold `Cinzel` caps,
  date/time in a lighter serif, listed as rows) showing all three events
  from the schedule above. Same action buttons and nav links as the
  wedding page (back Home, across to the Wedding invitation).

## Shared features (build once, use from both invitation cards)

Create `js/config.js` — a single `WEDDING_CONFIG` object holding every
editable fact: couple names/roles, hosts, both venues (name, address, map
link), the full schedule array, the RSVP WhatsApp number + prefilled
message, the closing line, and the site's own deployed URL (for the share
button). Every other script reads from this object rather than hardcoding
these values a second time.

Create `js/features.js` with:
- `downloadICS({title, description, location, startUTC, endUTC})` — builds
  a valid `.ics` string by hand (`BEGIN:VCALENDAR` / `VEVENT` block with
  `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`,
  `LOCATION`), wraps it in a `Blob`, and triggers a download via a
  temporary `<a download>` click. **Store the event start/end times in
  `config.js` pre-converted to UTC** (India Standard Time is a fixed
  UTC+5:30 offset, no DST) so the calendar entry is correct regardless of
  the guest's own timezone — don't rely on `new Date(...)` parsing, which
  is ambiguous across locales.
- `addWeddingToCalendar()` / `addReceptionToCalendar()` — thin wrappers
  around the above using the relevant config block.
- `shareInvite()` — uses `navigator.share` where available; falls back to
  `navigator.clipboard.writeText` plus a small toast notification
  ("Link copied ✓") if not.
- `rsvpLink()` — builds a `https://wa.me/<number>?text=<encoded message>`
  URL from config.
- `hydrateConfig(root)` — finds every element with a `data-cfg="dot.path"`
  attribute and fills its `textContent` (or `href`, for `<a>` tags) from
  `WEDDING_CONFIG`. Use this for the map-link hrefs at minimum, so venue
  changes in one file propagate everywhere.
- `makeKeyboardActivatable(el, handler, label)` — adds
  `role="button"`, `tabindex="0"`, `aria-label`, and an Enter/Space
  `keydown` handler to any click-only interactive element.
- `initLoader()` — fades out and removes a `#loader` overlay once the
  window has finished loading, with a small minimum display time (~700ms,
  0 if `prefers-reduced-motion`) so it never just flickers.
- Export `prefersReducedMotion` (from
  `matchMedia('(prefers-reduced-motion: reduce)').matches`) for every page
  to check before starting continuous `requestAnimationFrame` loops
  (particles, ambient smoke, etc.) or elaborate open-door animations.

On every page, add:
- A simple full-screen `#loader` div (couple's mark + names, pulsing),
  removed by `initLoader()`.
- Buttons/links wired to `addWeddingToCalendar()` / `addReceptionToCalendar()`
  as appropriate, `shareInvite()`, and an `<a>` whose `href` is set from
  `rsvpLink()` on load — styled to match that page's button style.
- A `@media (prefers-reduced-motion: reduce)` block that disables/shortens
  every decorative CSS animation (Ken Burns pan, twinkle, flicker, pulse,
  shake, marquee bulbs) and shortens scene-transition durations.
- `a:focus-visible, [tabindex]:focus-visible, button:focus-visible` given a
  clearly visible outline.

## File structure

```
project-root/
├── index.html
├── wedding.html
├── reception.html
├── js/
│   ├── config.js
│   └── features.js
├── assets/
│   ├── temple-tower.jpg     (cropped gopuram photo, for wedding.html)
│   └── temple-sunset.jpg    (wide dusk complex photo, for index.html)
└── README.md
```

## README requirements

Include: what the site is, the file structure, where to edit content
(point at `js/config.js`), the photo credit/license line, how to run
locally (`python3 -m http.server`), and exact GitHub Pages deploy steps
(`git init` → create repo → push → enable Pages from the `main` branch
root in repo Settings → update `site.url` in config.js to the resulting
URL).

## Validation checklist

- [ ] All three pages load with zero console errors.
- [ ] Tamil ௐ glyph renders correctly (not a missing-glyph box) wherever
      used; no 🕉 or other generic Hindu-iconography emoji anywhere.
- [ ] The temple photo and the built doorway below it read as one
      continuous, believably dark, lamp-lit scene — no visible brightness
      or detail-level seam between photo and CSS.
- [ ] Wedding doors: click opens them with visible raking light, a growing
      light shaft, drifting dust, and a settling shake, then reveals the
      invitation. Same via Tab + Enter.
- [ ] Reception doors: click/Enter slides the glass leaves apart and
      reveals the modern card. Visually and mechanically distinct from the
      wedding doors.
- [ ] Add to Calendar downloads a valid `.ics` for both the wedding and
      reception events with correct UTC times.
- [ ] RSVP button opens WhatsApp with the correct number and a prefilled
      message.
- [ ] Share button uses the native share sheet or falls back to clipboard
      + toast.
- [ ] Everything works and looks intentional at both a narrow mobile width
      (~375px) and a desktop width (~1440px).
- [ ] Setting the OS/browser "reduce motion" preference visibly calms the
      site down (no Ken Burns pan, no particle drift, instant door
      transitions) without breaking layout.
