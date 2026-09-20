# Shankar Prasad & Haripriya — Wedding Invitation

An interactive, three-part wedding invitation website. Pure HTML/CSS/JS —
no build step, no backend, works offline once loaded.

## The experience

1. **`index.html`** — Landing page with a real photo of the temple complex
   at dusk, the couple's names, and two doorways to choose from.
2. **`wedding.html`** — A real photograph of the Madurai Meenakshi Temple's
   gopuram, with an interactive carved-door entrance built in CSS/Canvas.
   Touching the doors opens them (real-time animation: raking light,
   drifting dust, an impact shake) and reveals the wedding invitation.
3. **`reception.html`** — A modern glass-and-gold entrance with bokeh
   lighting. Touching the doors slides them apart to reveal the reception
   invitation.

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

## Editing the content

Everything that changes per-wedding lives in **[`js/config.js`](js/config.js)**:
names, dates, times, venue names/addresses, Google Maps links, the RSVP
WhatsApp number, and the printed schedule. Edit that one file and the
Add-to-Calendar, RSVP, and map-link buttons all pick up the change
automatically. (The large decorative card text is written directly in each
HTML file, since it's laid out with specific line breaks and typography —
search the file for the phrase you want to change.)

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

- The temple/reception doors are fully keyboard-operable (Tab to focus,
  Enter/Space to open) and screen-reader-labelled.
- All decorative motion (particles, door animation, Ken Burns pan) respects
  `prefers-reduced-motion` and is disabled or shortened for guests who have
  that OS setting on.
- Everything is plain CSS/Canvas — no external JS framework or 3D engine —
  so the pages load fast even on a mid-range phone over mobile data.
