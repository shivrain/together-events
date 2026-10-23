# Together Community page

Static page at https://shivrain.github.io/together-events/.

- `index.html`: page shell (intro, speakers, programs, other events) and the together.fund footer
- `assets/css/community.css`: page styles, loaded after together.fund's Webflow stylesheet (which styles the footer)
- `assets/js/community.js`: renders everything from `data/events.json`, including the isometric line drawings
- `assets/img/speakers/`: 640×640 speaker portraits
- `data/events.json`: `speakers` (name, role, photo, bio), `salon` (Reasoning Traces and its topics), `programs` (hackathons, talks, college visits) and `groups` (other events)

To add a speaker, drop a square photo in `assets/img/speakers/` and add an entry to `speakers`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000.
