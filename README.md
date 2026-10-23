# Together Community page

Static page for the Together Fund community at https://shivrain.github.io/together-events/.

- `index.html`: page shell (nav, hero, sections, footer, modal)
- `assets/css/community.css`: all styles; brand fonts load from the together.fund Webflow CDN
- `assets/js/community.js`: renders every section from `data/events.json`, with no carousels
- `data/events.json`: every event, plus the impact ranking (`rank`, `why`, `stats`) and the most-watched YouTube recordings (`watch`)

Ranking: the top 15 events are ranked by hand on three signals: who was in the chair, demand for the room (Luma registrations/applications), and reach afterwards (YouTube views, LinkedIn). Edit `rank` / `why` in `data/events.json` to change it.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000.
