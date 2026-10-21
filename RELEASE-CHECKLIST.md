# Final invitation review

## Analytics UI removed — 21 October 2026

- Removed the Privacy button, analytics settings panel, stylesheet and UI handlers.
- Automatic tracking remains; previous saved declines are still respected.
- No invitation or music controls were changed. Cookie-based GA4 and the host's
  applicable consent/disclosure obligations remain unchanged.
- This supersedes the on-demand Privacy panel described in earlier entries below.

## Automatic analytics — 21 October 2026

- Removed the opening analytics prompt. New visits are tracked automatically through the shell.
- The on-demand Privacy panel explains collection and provides on/off controls.
  Previous saved declines are preserved; automatic mode is not recorded as explicit acceptance.
- Storage-unavailable opt-outs stay disabled for the current session without a reload.
- Validation: 68 unit tests pass; analytics controller line coverage is 98.46%.
  Focused mobile-sized Chromium checks verify automatic page views without a prompt,
  existing opt-outs, disable/re-enable, cookie cleanup and all custom events.
  Browser adapter executed-byte coverage is 95.71%; Google is stubbed in tests.
- This remains cookie-based GA4, not anonymous or cookieless tracking. The host must
  assess applicable prior-consent requirements; opt-out alone does not satisfy all jurisdictions.
- [ ] Keep GA4 Enhanced measurement OFF to avoid duplicate page/event tracking.
- [ ] Open the site in a fresh browser and check Realtime; no acceptance is required.
- The consent-first behavior in the 19 October section below is historical and superseded.

## Consent-based analytics — 19 October 2026

- Added GA4 `G-78D63NNW7R` only to the persistent shell; no Google requests before acceptance.
- Privacy control allows decline/withdrawal without affecting invitation functionality.
- Fixed-label events cover logical pages, navigation, maps, calendar/share clicks,
  invitation reveals, scroll milestones and music/motion controls. No RSVP or guest count inference.
- Query/hash values, arbitrary click text, form contents and raw IP custom fields are excluded.
- Validation: all 67 unit tests pass; analytics controller line coverage is 98.44%.
  Focused intercepted Chromium checks pass for consent, withdrawal/cookie cleanup,
  saved choices, all custom event types, navigation/history deduplication, mobile width
  and URL redaction. Analytics browser adapter executed-byte coverage is 95.28%.
  Google is stubbed in these checks; report ingestion still requires the Realtime check below.
- [ ] In GA4, turn **Enhanced measurement OFF** to prevent duplicate automatic events.
- [ ] Keep Google Signals/user-provided data/advertising features off; review retention settings.
- [ ] After deployment, accept analytics in a fresh browser and confirm one visit in Realtime.
- [ ] Verify the privacy choice and invitation still work on the intended mobile browsers.
- The earlier sections below are historical validation/publication notes, not current deployment status.

## Completed locally — 1 October 2026

- Preserved the blossom landing, bronze-maroon wedding scroll and midnight floral reception.
- Added the wedding's below-scroll date, time, temple/address and closing section;
  both wedding directions links use the original temple location, reconfirmed by the owner on 2 October. Ceremony times are unchanged.
- Removed WhatsApp RSVP, its unused contact configuration and redundant guest-detail links.
- Consistent SVG action arrows; no mobile emoji substitution.
- Closed reception entrance fits the tested mobile viewports, including 320 × 568.
- Added canonical/Open Graph metadata and descriptions with existing poster artwork.
- Sharing: native share → clipboard → persistent, labelled manual-copy field. Cancelling is silent.
- Calendar: stable, distinct event UIDs; current UTC export timestamp; escaped text; UTF-8-safe line folding.
- Status feedback uses a polite live region. No additional animation or runtime packages.
- 54 hermetic unit tests pass. Measured line coverage: 98.69% of loaded JS/tool modules;
  shared features have 100% coverage. This measurement does not include HTML, CSS or inline scripts.
- Five Chromium suites pass: landing, wedding, reception, mobile reception and sharing fallbacks.
- Unit-test CI with an 80% line-coverage gate is configured. It does not deploy the site.

## Continuous music — 15 October 2026

- Added one persistent player for the supplied 25.23-second Neethanae excerpt,
  looping across internal page navigation without replacing or pausing the audio element.
- Bottom music control remembers mute; blocked autoplay waits for a trusted interaction.
- Source file remains unchanged; the bundled MP3 is audio-only, about 830 KB.
- 60 unit tests pass; measured loaded JS/tool line coverage is 98.65%.
  The isolated music controller has 98.04% line coverage. Browser-only shell/entry scripts,
  HTML and CSS are not included in that Node coverage figure.
- Seven Chromium suites pass: existing landing, wedding, reception, mobile reception,
  sharing and translucency, plus HTTP music navigation/loop/fallback checks.
- Music checks include unchanged player identity and zero pause events across internal
  links and Back/Forward; framed calendar download and mocked sharing also pass.
- No real-device certification or deployment has been performed.

## Owner sign-off still needed before publishing

- [ ] Confirm permission to publish the supplied Neethanae music excerpt. It is downloadable
  when hosted; the source filename alone does not establish licensing rights.
- [ ] Review the new persistent bottom music bar on real iPhone/Safari and Android/Chrome:
  first-tap audio, mute, internal navigation, Back/Forward, and the 25-second loop join.
  Test using HTTP/HTTPS; direct local-file previews do not enable the music shell.
- [ ] Confirm Tamil invitation wording, names, family details, venues and times with the family.
- [ ] Resolve the legacy reception schedule discrepancy: the unused schedule says 6:00 PM;
  displayed reception text and calendar start use 6:30 PM. No facts were silently changed.
- [ ] Confirm the intended public URL matches `site.url` in [js/config.js](js/config.js).
  Also update all canonical/Open Graph URLs in the three HTML heads if it changes.
- [ ] Confirm reuse rights for all supplied video clips and their poster images. Downloading
  footage alone does not establish publication rights. Social previews also use those posters.
- [ ] Both people approve publication of the decorative fingerprint-heart derivative.
  It remains downloadable and is not guaranteed biometric anonymization.
- [ ] Keep all three original fingerprint JPEGs outside the published/served files.
  Ignore rules alone do not prevent a static server exposing them. Originals are unchanged.
- [ ] Check the final hosted page on a real iPhone/Safari and Android/Chrome, especially
  native sharing, calendar import and video behavior in power-saving modes. Local Chromium
  tests do not certify all devices or native calendar applications.
- [ ] Check the hosted social preview after deployment; platforms may cache older previews.

## Publication boundary

Nothing has been committed, pushed or deployed by this finishing pass. Publish only the
reviewed three invitation HTML pages plus the new invite.html music shell, styles,
JavaScript and approved assets (including the music only after rights approval). Do not upload the entire
workspace indiscriminately, and do not include private source images or tooling outputs.

No further visual redesign is recommended before this review; preserve the approved design.