/* Renders the Community page from data/events.json: a speaker grid and a plain list of other events. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderSpeakers(list) {
    var grid = document.getElementById('speakerGrid');
    grid.innerHTML = list.map(function (s) {
      return '<li><button class="speaker" type="button" aria-expanded="false" aria-controls="sp-' + esc(s.id) + '">' +
        '<span class="speaker__frame">' +
          '<span class="speaker__info" id="sp-' + esc(s.id) + '">' +
            '<span class="speaker__event">' + esc(s.event) + '</span>' +
            '<span class="speaker__about">' + esc(s.about) + '</span>' +
          '</span>' +
          '<span class="speaker__hint" aria-hidden="true"></span>' +
          '<img class="speaker__photo" src="' + esc(s.photo) + '" alt="' + esc(s.name) + '" loading="lazy" decoding="async"/>' +
        '</span>' +
        '<span class="speaker__name">' + esc(s.name) + '</span>' +
        '<span class="speaker__role">' + esc(s.role) + '</span>' +
      '</button></li>';
    }).join('');

    // Clicking a speaker lifts the photo to reveal the session underneath; one open at a time.
    grid.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.speaker');
      if (!btn) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      grid.querySelectorAll('.speaker[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      btn.setAttribute('aria-expanded', String(!open));
    });
  }

  function renderEvents(list) {
    document.getElementById('eventList').innerHTML = list.map(function (e) {
      return '<li class="event"><h3 class="event__name">' + esc(e.name) + '</h3><p class="event__about">' + esc(e.about) + '</p></li>';
    }).join('');
  }

  fetch('./data/events.json?v=20261023c')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      renderSpeakers(d.speakers || []);
      renderEvents(d.events || []);
    });
})();
