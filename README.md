# Shankar Prasad & Haripriya — Wedding Invitation

An interactive, three-part wedding invitation website. Pure HTML/CSS/JS —
no build step and no backend. Local artwork is bundled; Google Fonts and
external actions (maps, WhatsApp, sharing) may require internet access.

## The experience

1. **`index.html`** — A full-screen golden-arches video: original hanging
   brass lamps, a framed Om blessing, ivory calligraphy, a kolam-inspired
   ornament and two engraved arches leading to the wedding and reception.
   The supplied portrait clip loops silently behind the invitation throughout
   scrolling. Proportions are preserved with a centered cover crop, never
   stretched. A matching still image remains available when video cannot play.
2. **`wedding.html`** — An arakku-maroon silk scroll over the golden-arches video, with zari borders,
   a clear gold Tamil Om and Tamil invitation wording. Drag the braided golden
   bow downwards (or tap / press Enter or Space): the knot tensions, the loops
   release, and the scroll unfurls before a single gold-petal cascade.
3. **`reception.html`** — A floral garden video under midnight-blue shading,
   with original botanical SVG artwork, champagne-gold accents and drifting fireflies. Open the sealed
   envelope to reveal an ivory invitation letter. Date, time, venue and
   WhatsApp RSVP are also available below the letter, without a reveal.

The courtyard landing redesign leaves both invitation pages and the shared
configuration/helpers unchanged. No build step, backend, environment variables
or additional runtime dependencies are required.

## File structure

```
eInvWedding/
├── index.html          Landing page
├── wedding.html         Temple entrance + wedding invitation
├── reception.html       Modern entrance + reception invitation
├── js/
│   ├── config.js         ← All editable text/dates/venues live here
│   └── features.js       Shared helpers: calendar export, share, RSVP, a11y
├── assets/
│   ├── temple-tower.jpg   Real photo of the Meenakshi Temple gopuram
│   └── temple-sunset.jpg  Real photo of the temple complex at dusk
└── README.md
```

Landing-specific files:
- [styles/landing.css](styles/landing.css) — courtyard composition, responsive
   arches, CSS ambient motion, keyboard focus, print and forced-colors styles.
- [js/landing.js](js/landing.js) — validated UTC countdown, motion preferences
   and shared content/action initialization. Controllers expose cleanup functions.
- [js/background-video.js](js/background-video.js) — shared lazy video playback
   and still-fallback handling used by landing and reception, without duplicated
   media assets or page-specific playback logic.
- [assets/temple-lamp.svg](assets/temple-lamp.svg) — original engraved hanging
   brass lamp, reused on both sides with separate, pausable flame effects.
- [assets/courtyard-kolam.svg](assets/courtyard-kolam.svg) — original ornamental
   linework inspired by kolam, not a prescribed ritual diagram.
- [assets/portal-temple.svg](assets/portal-temple.svg) and
   [assets/portal-garden.svg](assets/portal-garden.svg) — original invitation icons.
- [tests/landing.test.cjs](tests/landing.test.cjs) — hermetic controller tests.

Wedding-specific files:
- [styles/wedding-refinements.css](styles/wedding-refinements.css) — silk/zari,
   Tamil hierarchy, proportionate bow, layered petal motion and print fallback.
- [js/wedding-scroll.js](js/wedding-scroll.js) — testable pull thresholds,
   cancellation, staged reveal timing and bounded petal specifications.
- [js/wedding-effects.js](js/wedding-effects.js) — original braided SVG bow,
   native button/pointer capture, focus handling and one-shot particle cleanup.
- [tests/wedding-scroll.test.cjs](tests/wedding-scroll.test.cjs) and
   [tests/wedding-effects.test.cjs](tests/wedding-effects.test.cjs) — hermetic
   unit tests using fake timers, deterministic randomness and fake DOM elements.
- [tests/wedding.browser.cjs](tests/wedding.browser.cjs) — Chromium checks for
   drag/tap/keyboard, mobile/desktop geometry, text, reduced motion, print and no-JS.
   Run with `PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/wedding.browser.cjs`
   using an existing Playwright installation and Chromium browser.

### Wedding refinement — October 2026

The wedding retains its event facts and S/H charms. The deity invocation,
English invitation heading and professional titles have been removed as requested.
Both parent lines now sit beneath their respective names; “(Late)” is smaller
but remains readable. The original Tamil invitation paragraph is editorial
content in [wedding.html](wedding.html); review wording with the family before publishing.

Pulling about 52 CSS pixels opens the tie; shorter drags spring back without
opening, and cancelled touch gestures do not open it. Tap and keyboard remain
equivalent alternatives. The release takes 650 ms, followed by a 2.8-second
downward unfurl. The top brass rod stays anchored while the lower silk cylinder
travels down the sheet, progressively revealing stationary, unscaled text.
Moving weave and fixed cylindrical lighting suggest rotation; the roll narrows
from 92 px to a visible 28 px curl rather than disappearing into a flat panel.
The controller supplies the shared CSS duration so motion and completion stay
in sync. Browser regressions sample intermediate frames to check the anchored
top, gradual reveal, moving texture and cylinder alignment at four widths.
One cascade of 24 mobile / 36 desktop petals follows; all particles are
removed within five seconds. Ambient dust and endlessly moving tassels were
removed so the ceremony settles into a still, readable invitation.

Gold ornamentation uses the original local
[mango-buta and flowering-sprig tile](assets/patterns/wedding-gold-buta.svg).
It adds woven gold detail to the closed roll and richer edges on the open silk;
the text area stays subdued, and the surrounding video is left free of pattern overlays.
Four engraved lotus finials have linked bell caps and thirteen beaded tassel
strands each. H/S pendants have dark maroon enamel, gold-foil initials and a
single staggered light sweep clipped to each charm. The shine ends within
5.2 seconds, stops on release, and is disabled for reduced motion.

The wedding now shares the landing's [golden-arches video](assets/landing-golden-arches.mp4)
and matching poster without duplicating either asset. A warm, shaded full-screen
background complements the opaque maroon silk, with dark-backed instructions
and action buttons to preserve contrast. The extra pillar overlays and repeated
background pattern are no longer displayed: the video supplies the architecture.
Earlier pillar and arch artwork remains available in assets for later exploration.
The landing page remains unchanged while its future background is undecided.

[js/wedding-backdrop.js](js/wedding-backdrop.js) connects the shared
[video adapter](js/background-video.js) to a Pause/Resume background button,
live reduced-motion preferences, tab visibility and page suspension/restoration.
The muted, inline looping video uses a centered cover crop, never stretching.
Reduced motion and no-JavaScript visitors see the poster without loading video;
blocked autoplay and media errors also retain the poster. Print hides the backdrop
and its controls. The pause button controls only the video, not the brief scroll
opening. Tests in [tests/wedding-backdrop.test.cjs](tests/wedding-backdrop.test.cjs)
use fakes; the wedding browser suite verifies playback and layout.

Reduced motion skips the sequence and petals, including when changed while
opening. Closed content is inert until revealed and focus moves to the Tamil
heading. Without JavaScript the invitation remains open; printing includes the
invitation even when the interactive scroll is closed. No runtime dependencies,
new video assets or changes to the landing/reception pages are required.

Run all unit tests with `node --test tests/*.test.cjs`.

Reception-specific files:
- `styles/reception.css` — responsive layout, stationery and print styles.
- `js/reception.js` — accessible envelope reveal and motion controls.
- `assets/reception-botanical.svg` — original local floral artwork.
- `tests/reception.test.cjs` — dependency-free unit tests.
- [assets/fingerprint-heart.png](assets/fingerprint-heart.png) — softened, locally
   composed fingerprint heart; wine left half and lavender right half.
- [assets/seal-sprig.svg](assets/seal-sprig.svg) — lavender and wine flowers
   tucked horizontally behind the gold wax seal: lavender left, wine right.
- [assets/garden-bough.svg](assets/garden-bough.svg) — original moonlit canopy
   with veined leaves, fine gold branches and hanging celestial ornaments.
- [assets/stationery-flourish.svg](assets/stationery-flourish.svg) — reusable
   gold botanical engraving for the ivory letter and evening details.
- [tools/fingerprint-art.cjs](tools/fingerprint-art.cjs) — pure paper-removal and
   tint/gap-softening transforms, covered by [tests/fingerprint-art.test.cjs](tests/fingerprint-art.test.cjs).

## Editing the content

Everything that changes per-wedding lives in **[`js/config.js`](js/config.js)**:
names, dates, times, venue names/addresses, Google Maps links, the RSVP
WhatsApp number, and the printed schedule. Edit that one file and the
Add-to-Calendar, RSVP, and map-link buttons all pick up the change
automatically. The reception's displayed names, date, time, venue and closing
line also use `data-cfg` bindings, so those update from config. The landing's
date, both event times and venue names also use these bindings, and its countdown uses
`wedding.icsStartUTC`. The landing preserves the original short display names
(Shankar Prasad / Haripriya), welcome copy and city as editorial HTML; edit those
and the description metadata separately if the event changes. The wedding page
still has hardcoded decorative text. Reception editorial copy and the S/H monogram live
in `reception.html`, as does fallback content for guests without JavaScript.

The reception uses `reception.timeDisplay` (currently **6:30 PM onwards**),
not the legacy `schedule` entry, which still says 6:00 PM. Confirm the
intended time before publishing and keep the UTC timestamps consistent.

Calendar times in `config.js` are stored pre-converted to UTC (India is
UTC+5:30 year-round, no DST), so the downloaded `.ics` file is correct
regardless of the guest's own timezone. If you change a date/time, convert
the new IST time to UTC by subtracting 5 hours 30 minutes.

## Photo credit

`assets/temple-tower.jpg` is cropped from a photo of the Meenakshi Amman
Temple's South Gopuram by **Madhuranthakan Jagadeesan**, via Wikimedia
Commons, licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Keep this credit if the site is shared publicly at any scale.

## Running locally

### Fingerprint privacy — before serving or publishing

All three original fingerprint JPEGs supplied for the design are private source
material. Their exact root paths are excluded in [.gitignore](.gitignore).
**Ignore rules do not prevent a static server or manual folder upload from
exposing these files.** Keep the originals outside any publicly served or
uploaded directory, and check the deployment contents before publishing.
The editing session has left the originals in place and unchanged.

The reception references only the 256 × 224 decorative PNG, never the original
JPEGs. It contains two equally sized, mirrored heart halves, composed locally
from cropped, downsampled prints with softened wine/lavender ink and a fine
gold join. This treatment is **not guaranteed biometric anonymization**;
the displayed derivative remains downloadable by visitors. Do not publish
even the derivative unless both people are comfortable with that exposure.

The bride's half now uses the clearer replacement scan, [Image (60).jpeg](Image%20(60).jpeg),
with a normalized crop of `(0.35, 0.22, 0.40, 0.46)` at 120 × 180 pixels.
It retains the muted lavender tint and faint-ridge contrast treatment without
added blur or ink spread. The groom's half is pixel-for-pixel unchanged.
A subtle tint remains beneath each half. Fine ridge spacing is retained;
this is decorative retouching, not a reconstructed or forensic fingerprint.
Original source files remain untouched. Both halves use subdued ink colors
so the heart is a personal detail rather than the invitation's main palette.

Any static file server works. For example:

```bash
python3 -m http.server 9010
```

Then open `http://localhost:9010/index.html`.

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g. `ShaHaWeddingInvite`) — it can be
   private or public; GitHub Pages works either way on a paid plan, and
   public repos get Pages free.
2. From this folder, push it up:

   ```bash
   cd /Users/sprasadk/Documents/Innovation/Ideas/eInvWedding
   git init
   git add .
   git commit -m "Wedding invitation site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/ShaHaWeddingInvite.git
   git push -u origin main
   ```

3. On GitHub: go to the repo's **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   branch `main`, folder `/ (root)`. Save.
5. GitHub gives you a URL like
   `https://<your-username>.github.io/ShaHaWeddingInvite/` within a minute
   or two.
6. Update `site.url` in `js/config.js` to that exact URL — the Share button
   uses it — then commit and push again.

To update the live site later, just edit files and:

```bash
git add .
git commit -m "Update wedding details"
git push
```

GitHub Pages redeploys automatically within a minute.

## Accessibility & performance notes

- The landing has no blocking loader. Both invitation links, the names and
   event facts remain readable without JavaScript; script-only controls and
   the countdown stay hidden until initialized. Font failures use local fallbacks.
- A keyboard skip link targets the invitation section. Both arches are ordinary
   links; share/motion controls are native buttons. Share feedback uses a polite
   status region. The countdown does **not** announce every second; it announces
   completion once, without claiming the ceremony has actually concluded.
- One **Pause motion** button controls the landing's background video,
   lamps, flames, 12 lights and exactly two distant birds. Each bird has two
   articulated wings with synchronized flap cycles and slightly different
   silhouettes. Birds are 22px and 18px wide with muted opacity for distance.
   Each slender lamp has one small curved SVG flame anchored to its wick.
   Lamps and flames remain mostly still, moving briefly in a light breeze
   instead of continuously wobbling. Decorative effects use CSS timelines
   rather than a per-frame Canvas loop. Reduced motion is honored on load and
   when changed; hidden tabs and page suspension pause motion and countdown
   work. The top countdown continues ticking when **Pause motion** is pressed;
   it catches up from real time on return to the page. Without JavaScript,
   the scenery and lamps remain still. No audio plays automatically.
- The current golden-arches video is decorative imagery, not the ceremony venue.
   [assets/landing-golden-arches.mp4](assets/landing-golden-arches.mp4) is a local
   H.264 copy of the supplied Klickpin download (pin 4151824653513112): approximately
   5.2 seconds, 720 × 1280 and 1.2 MB. The source has no audio; its video stream is
   preserved without re-encoding, with fast-start metadata. The full clip loops;
   no seamless-loop editing has been applied.
   Its portrait composition is cropped more heavily on wide desktop screens.
   [assets/landing-golden-arches-poster.jpg](assets/landing-golden-arches-poster.jpg) is preloaded
   and shown during loading, failed/blocked playback, reduced motion and no-JS.
   Video is loaded only when motion is allowed; initial reduced motion and no-JS
   do not request the MP4. Manual pause freezes the current frame; reduced motion
   restores the poster. Hidden tabs/page suspension pause playback. The original
   Documents video, [Image (61).jpeg](Image%20(61).jpeg), and previous sunset photo
   are untouched. Downloading does not establish a republication license; verify
   creator permission before publishing this trial.
- Reception opening and folding use native buttons, `aria-expanded`, a
   live status message and focus management. The unopened letter is not
   keyboard-focusable. A skip link goes directly to event details.
- Without JavaScript the reception letter, maps and WhatsApp link remain
   visible; unavailable script-only actions stay hidden. Print styles show
   the letter even if the envelope has not been opened.
- Reception animations respect `prefers-reduced-motion`, including live
   preference changes. The **Pause garden motion** control pauses both the
   fireflies and the flowers' soft breeze, even when Canvas is unavailable.
   It also pauses the names' single foil shimmer after each opening; reduced
   motion and printing use solid, readable name inks instead.
   The lantern glow shares the same control. Ambient motion pauses in hidden
   tabs; fireflies retain their position when paused and resume without jumping
   after tab visibility or motion-preference changes. Canvas resolution is
   capped and updated only on resize. Without
   JavaScript, the flowers and lanterns remain still.
- The reception retains the approved silent floral video and matching poster,
   [assets/landing-garden.mp4](assets/landing-garden.mp4) and
   [assets/landing-garden-poster.jpg](assets/landing-garden-poster.jpg).
   This is the separate 25.3-second floral clip, not the landing's golden arches.
   Its background fills the viewport throughout scrolling, with proportional
   cover cropping and navy shading. **Pause garden motion** freezes video along
   with the existing effects. Reduced motion shows the poster; reduced motion
   on initial load and no-JS do not download video. Playback failures also leave
   the poster visible. The envelope, ivory letter, fingerprint heart and event
   actions are preserved. The landing's appearance and behavior are unchanged.
- Two small gilt highlights appear once along the paper borders after opening.
   They share the motion pause control, stay invisible under reduced motion,
   and are omitted in print. Seal and action feedback supports keyboard focus
   as well as pointer hover; secondary actions wrap on narrow screens.
- Forced-colors mode uses solid system-color name text and focus outlines
   instead of relying on gradient-clipped lettering.
- No framework, 3D engine, external image service or runtime package is used.

## Tests

With Node.js 22 or later (development only):

```bash
node --test --experimental-test-coverage --test-coverage-include='js/landing.js' --test-coverage-include='js/reception.js' --test-coverage-include='js/background-video.js' --test-coverage-include='tools/fingerprint-art.cjs' tests/*.test.cjs
```

Tests use fake DOM nodes, animation frames, timers, media queries and seeded
random values; they do not make network requests or launch a browser.
The reception controller is tested for reveal/replay, focus, rapid interactions,
reduced motion, pause/resume, page visibility and shared-action wiring.
Motion continuity is tested across manual pause, resize, hidden tabs, page
restoration and reduced-motion preference changes.
Pixel-transform tests cover paper removal, softened ridge breaks, image
boundaries, invalid dimensions, empty input and source immutability.
Landing tests cover invalid/rolled-over UTC dates, countdown values and completion,
hidden pages/restoration, manual and OS motion preferences, listener cleanup,
configuration hydration and sharing wiring.

Optional browser integration checks live in [tests/landing.browser.cjs](tests/landing.browser.cjs).
Run `node tests/landing.browser.cjs` with Playwright and its Chromium browser
available in the development environment. `PLAYWRIGHT_MODULE` may point to an
existing Playwright module outside this project; no runtime dependency is added.
This separate IO-based check is not part of the hermetic unit suite. It uses a
fixed browser clock to verify timer position and ticking, exactly two birds/four
moving wings with synchronized timing, two small flames, restrained lamp/bird
sizes, artwork-to-flame alignment, pause without
stopping the countdown, reduced motion, and no-JavaScript fallback. It passed
at 320, 390, 768 and 1440px after the restrained-motion revision; screenshots are
written to the system temporary directory on macOS.

Latest video-trial validation: **28 unit tests pass**; the landing controller has
**98.71% line coverage, 98.67% branch coverage and 100% function coverage**.
Local Chromium video checks passed at widths 280, 320, 390, 600, 768 and 1440:
actual muted inline playback, viewport coverage without stretching, pause/resume,
continued countdown, reduced motion, no-JS and blocked-autoplay fallback. The
hermetic video tests also cover media errors and pending playback during cleanup.

Earlier courtyard validation additionally covered:
no horizontal overflow, loaded artwork, correct event facts, keyboard skip/link
navigation, Space/Enter motion controls and live reduced-motion changes.
Also checked JavaScript disabled with blocked web fonts, direct reception
navigation, forced colors, print, and mocked native-share/clipboard success
and clipboard failure (nothing shared externally). No browser script errors
or failed local resource requests were observed. These are local checks, not
cross-browser certification or automated CI.

Before publishing, also check desktop and narrow phone layouts, keyboard
Enter/Space, reduced motion, JavaScript disabled, calendar download and
map/WhatsApp destinations. GitHub Pages remains the deployment mechanism;
there is no automated CI pipeline configured in this folder.

## Design notes / release notes

**Golden arches main-page trial (current):** replaced only the landing video and
poster with the new five-second golden architectural clip. Existing full-screen
cover sizing, shading, names, lamps, countdown and motion controls are retained.
The reception's approved floral background and the original source videos are
unchanged. Browser regression checks require the new landing-specific assets.

**Reception video background:** reused the floral clip behind the midnight-garden
composition, with a matching static fallback and shared motion controls. A common
video controller now serves both pages. Page suspension stays paused even when
motion preferences change while away. Added hermetic reception video integration
coverage and [tests/reception.browser.cjs](tests/reception.browser.cjs) for real
playback, closed/open layouts, keyboard replay, scrolling, reduced motion, print,
no-JS and failed-playback fallbacks. Run it like the landing browser suite using
`PLAYWRIGHT_MODULE` when Playwright is installed outside the project.

**Floral garden video trial (superseded on landing; retained on reception):** replaced the static arch with the supplied
portrait video. Preserved countdown, lamps/flames, birds, names and invitation
links. Added matching poster fallback and integrated video with the existing
motion/lifecycle controller. Wedding and reception pages remain unchanged.

**Supplied sandstone arch trial (superseded):** replaced the sunset courtyard with
`Image (61).jpeg`, rotated upright through CSS. Adapted the frame to desktop and
phone proportions, keeping a clear central area for the existing ivory text.
The countdown, lamps/flames, invitation links and motion controls are retained.
Source images, wedding and reception pages are unchanged. Browser checks cover
artwork loading, viewport coverage and persistence while scrolling.

**Immersive mobile correction:** removed the landscape-banner layout below.
The photograph now fills the mobile viewport and remains behind the invitation
at every scroll position. A left-aligned portrait crop prioritizes the main
tower without stretching the image; lighter translucent shading retains visible
scenery. Countdown and names are overlaid again, rather than moved beneath a
photo strip. Browser checks verify viewport coverage at both the top and footer.

**Mobile temple panorama (superseded):** replaced the heavily cropped phone backdrop with a
full-width, proportionate photograph above the countdown and names. The Om and
lamps remain over the sky; the invitation text sits below the scenery. Tightened
mobile spacing without reducing touch targets or preventing scrolling. Desktop
styling is unchanged. Browser checks cover 280, 320, 390, 600, 768 and 1440px,
including mobile photo proportions, no zoom/crop, and countdown placement.

**Restrained traditional revision:** reduced hanging lamps from a 202px maximum
to 132px (70px on phones). Replaced the tall triple-flame treatment with one
small, curved, tapered SVG flame per lamp and a restrained amber glow.
Flames were subsequently enlarged by 25%, keeping their bases centered on the
wicks and retaining the same lamp sizes and gentle movement. Motion
now has long still intervals and a brief breeze, not constant flutter. The two
birds are smaller, lighter and slower, with distinct silhouettes and synchronized
wingbeats. The top ticking countdown, event details and invitation pages remain
unchanged. This supersedes the oversized triple-flame treatment below.

**Living flame and wing refinement (superseded lamp treatment):** moved the ticking countdown directly below
the Om blessing and above the names, with a gilt-rule surround and larger digits.
Enlarged the hanging lamps and added engraved scallops, small bells and brass
pendants. Three layered flames per lamp bend with the breeze and flutter at
different rates, with their bases anchored to the wicks. Exactly two birds now
flap their articulated wings while crossing the sky. Added configured venue
names and small gilt finials to the invitation arches. Existing pause/reduced
motion behavior remains in force; no audio or new runtime dependencies added.

**Temple courtyard at golden hour:** replaced the generic glass cards and palm
silhouettes with antique-brass lamp artwork, fine gilt corner rules, a framed
Om blessing and visible kolam-inspired ornament. The two arched entrances have
distinct maroon/temple and midnight/flower-and-crescent treatments, event times
and explicit invitation links. Original short names remain; the countdown now
leads into the welcome and celebrations (see refinement above). The mobile
layout scrolls instead of clipping. The wedding, reception, fingerprint artwork
and private originals are unchanged. No extra packages or cloud services added.

**Ivory paper — revised:** the faint embossed experiment was replaced with the
earlier [gold botanical sprigs](assets/letter-sprig.svg), retaining their fine
flowers, leaves and tiny accent buds. Slightly larger artwork, stronger opacity
and a fine ivory relief shadow give the existing design more definition without
the inward-fading mask. The soft champagne corner wash remains. Phone layouts
use smaller, lighter sprigs; print and forced-colors modes omit the backgrounds.
Names, crest, fingerprint artwork, gold heart frame and exterior garden remain
unchanged. No extra motion or repeating pattern is added.

**Satin crest buds:** the tiny wine and lavender buds have brighter gradient
highlights and fine ivory reflections. The crest's desaturation filter is
removed so their accent colors read clearly; gold stem artwork and oval frame
are unchanged. The shine is static, with no flashing or extra animation.

**Heart keepsake frame:** a fine matte antique-gold SVG outline follows the
fingerprint heart's outer contour. It is a static, decorative overlay (about
0.86px at the displayed size), with no glow or box. Both fingerprints and the
underlying PNG remain unchanged; the frame also appears in print.

**Finishing details:** one-time paper-border glints, a soft seal highlight,
keyboard-equivalent interaction states and lightly framed calendar/share
buttons refine the existing design. Firefly pause/resume no longer resets
positions. The replacement bride fingerprint from the third scan, groom's
half, main palette, landing and wedding pages remain unchanged in this pass.

**October 2026 — Midnight garden reception:** replaces the pastel seal card
with a navy envelope and ivory letter, original magnolia illustrations,
editorial typography, always-accessible event details and a focused RSVP.
The older `PROMPT.md` records the original temple/glass-door concept and is
not an exact specification of the current pages.

**Reception refinement:** flowers sway gently from their stems with different
timings on each side. The opened letter now uses an arched ivory silhouette,
an emerald edge, fine gold borders, a monogram crest and original botanical
engravings (`assets/letter-sprig.svg`). Calligraphic names, a clearer event
hierarchy and warmer invitation wording replace the plain rectangular card.
All event facts still come from config; landing and wedding remain unchanged.

**Two blooms, one story:** selected flowers and small engraved buds echo the
bride's lavender lehenga and groom's dark wine suit, while ivory magnolias,
midnight blue and champagne gold remain the main palette. The letter's
`assets/couple-botanical-mark.svg` traces S and H as intertwined gold stems
with a wine and lavender bud. A floral sprig sits beneath the envelope seal;
the names now use matching deep-green inks (see the latest refinement below). Fireflies
have visible warm amber cores with soft, feathered halos rather than harsh white specks.

**A heart that is only ours:** the groom's wine fingerprint and bride's lavender
fingerprint form equal halves of a small keepsake heart beneath their names.
The lace-style bow is replaced by a lavender sprig and wine bud. A single
champagne-foil sweep crosses each name after opening, with slightly staggered
timing. The inner gold arch has a subtle embossed edge. Landing, wedding and
shared configuration are unchanged; all new artwork is local.

**Moonlit heirloom — latest refinement:** midnight blue, ivory, deep green and
antique gold are the primary palette. Wine and lavender are limited to smaller,
desaturated accent blooms, the seal flowers, tiny crest buds and the keepsake
heart. Both names use the same deep-green ink with the existing one-time foil
shine. The letter gains a framed oval monogram, fine paper grain, layered gilt
edges, engraved botanical divider and a framed event section. The exterior
adds a leafy canopy, crescent emblem, fine arch tracery, softly lit lanterns,
and engraved envelope corners. The upright lavender stalk is replaced by a
low lavender flower on the seal's left, balancing the wine rose on its right.
These are decorative garden elements, not claims about the venue's actual decor.
