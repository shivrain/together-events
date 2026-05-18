# together-events-prototype

Phase 1 static prototype for the `/events` page on together.fund.

This is intentionally a single static page. It loads the live Together.fund
Webflow CSS bundle from CDN so the prototype inherits the production design
system 1:1; nothing here re-implements styles that already exist there.

## What's in scope (Phase 1)

- Navbar + footer copied from the homepage reference (with an added Events nav link)
- One fully-polished category carousel section: **AMAs / Founder Chats** (rendered from `data/events.json`)
- Photo grain/filter treatment, slide-up "Read More" hover, draggable scrollbar, prev/next arrows that fade at boundaries
- Inline "See all AMAs" expansion from the first three cards to the full AMA set
- Mobile-responsive at 375px, 768px, 1280px

Hero, featured event, "What We Do" strip, other category carousels, dedicated event-invite subscription, and the CTA footer block are queued for Phase 2.

## Run it locally

Serve the prototype from this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A local server is required for the carousel to fetch `data/events.json` in most browsers.

## Deploy to GitHub Pages

1. Push this folder to a new repo (e.g. `together-events-prototype`).
2. Repo Settings -> Pages -> Build from branch -> `main` -> `/ (root)`.
3. Visit `https://<user>.github.io/together-events-prototype/`.

The prototype links to the live Together CSS via CDN, so the look depends on internet access.

## Structure

```
together-events-prototype/
  index.html
  assets/
    css/events-page.css   - prototype-only additions (grain, line-clamp, fallbacks)
    js/events-page.js     - Swiper init for [data-events-swiper] elements
    images/placeholders/  - reserved for local placeholder files later
  data/
    events.json           - generated from ../data/events.csv; all CSV rows included
```

## CSV defaults

The source CSV found at `../data/events.csv` includes `Quarter`, `Category`, `Event Name`, `Featured`, `Location`, and `Description`.

Defaults applied in `data/events.json`:

- `status`: `Past` for every event because the CSV has no `Status` column.
- `externalLink`: empty string for every event because the CSV has no external link column.
- `tags`: single-item array using the CSV `Category` because the CSV has no tags column.
- `location`: empty string where the CSV `Location` cell is blank.
- `hosts`: empty array where the CSV `Featured` cell is blank; otherwise the CSV `Featured` value is preserved as a host/co-host entry.
- `imageUrl`: Unsplash placeholder URL selected by category because the CSV has no image/photo column.

## Webflow port

Per the planner (§7 Option A), the final destination is a native Webflow
build backed by a CMS Collection. This prototype is for design sign-off only.
