# Final invitation review

## Completed locally — 1 October 2026

- Preserved the blossom landing, bronze-maroon wedding scroll and midnight floral reception.
- Added the wedding's below-scroll date, time, temple/address and closing section;
  both wedding directions links use the newly supplied temple location. Ceremony times are unchanged.
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

## Owner sign-off still needed before publishing

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
reviewed three HTML pages, styles, JavaScript and approved assets. Do not upload the entire
workspace indiscriminately, and do not include private source images or tooling outputs.

No further visual redesign is recommended before this review; preserve the approved design.