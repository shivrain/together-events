# Together Community page

Static page at https://shivrain.github.io/together-events/.

- `index.html`: page shell (intro, speakers, other events, footer)
- `assets/css/community.css`: all styles; Neue Haas Unica loads from the together.fund Webflow CDN
- `assets/js/community.js`: renders the speaker grid and event list from `data/events.json`
- `assets/img/speakers/`: 640×640 speaker portraits
- `data/events.json`: `speakers` (name, role, photo, event, about) and `events` (name, about)

To add a speaker, drop a square photo in `assets/img/speakers/` and add an entry to `speakers`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000.
