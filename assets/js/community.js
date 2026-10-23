/* Renders the Community page from data/events.json. No carousels: everything is a static, ranked layout. */
(function () {
  'use strict';

  var FORMAT_ORDER = ['Fireside', 'Research salon', 'Talk', 'Workshop', 'Hackathon', 'Summit', 'Mixer', 'Podcast'];
  var FORMAT_LABEL = {
    'Fireside': 'Firesides & AMAs', 'Research salon': 'Research salons', 'Talk': 'Talks', 'Workshop': 'Workshops',
    'Hackathon': 'Hackathons', 'Summit': 'Summits', 'Mixer': 'Mixers & meetups', 'Podcast': 'Live podcasts'
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var ARROW = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var PLAY = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>';

  var TOP = 6; // feature cards: #1 full width, #2-3 halves, #4-6 thirds
  var data, byId = {};
  var state = { format: 'All', q: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(e) {
    if (e.date) {
      var p = e.date.split('-');
      return MONTHS[+p[1] - 1] + ' ' + p[0];
    }
    return e.quarter || '';
  }
  function place(e) { return e.city || e.venue || ''; }
  function shortTitle(t) { return t.replace(/\s*[☀-➿\uD83C-􏰀-\uDFFF]+/g, '').trim(); }

  function media(e, cls) {
    if (!e.image) {
      return '<div class="media media--fallback ' + (e.cardLabel ? 'media--name ' : '') + (cls || '') + '"><span>' + esc(e.cardLabel || shortTitle(e.title)) + '</span>' +
        (e.cardSub ? '<small>' + esc(e.cardSub) + '</small>' : '') + '</div>';
    }
    // Resolve against the page: a relative url() inside a custom property resolves against the stylesheet.
    var abs = new URL(e.image, document.baseURI).href;
    return '<div class="media ' + (cls || '') + '" style="--bg:url(\'' + esc(abs) + '\')">' +
      '<img src="' + esc(e.image) + '" alt="" loading="lazy" decoding="async"/></div>';
  }

  function actions(e) {
    var out = '';
    if (e.video) out += '<button class="btn btn--coral btn--sm" type="button" data-video="' + esc(e.video) + '">' + PLAY + ' Watch</button>';
    if (e.link) out += '<a class="btn btn--line btn--sm" href="' + esc(e.link) + '" target="_blank" rel="noopener">Event page ' + ARROW + '</a>';
    return out;
  }

  function renderTop5(list) {
    document.getElementById('top5List').innerHTML = list.map(function (e) {
      var stats = (e.stats || []).map(function (s) {
        return '<div><dt>' + esc(s.label) + '</dt><dd>' + esc(s.value) + '</dd></div>';
      }).join('');
      return '<article class="feat ' + (e.rank === 1 ? 'feat--lead' : e.rank <= 3 ? 'feat--half' : 'feat--third') + '" data-open="' + esc(e.id) + '" tabindex="0">' +
        '<span class="feat__rank" aria-label="Rank ' + e.rank + '">' + e.rank + '</span>' +
        media(e) +
        '<div class="feat__body">' +
          '<div class="feat__meta"><span class="fmt">' + esc(e.format) + '</span><span>' + esc(fmtDate(e)) + '</span><span>' + esc(place(e)) + '</span></div>' +
          '<h3 class="feat__title">' + esc(shortTitle(e.title)) + '</h3>' +
          (e.speakers ? '<p class="feat__speaker">' + esc(e.speakers) + '</p>' : '') +
          '<p class="feat__why">' + esc(e.why) + '</p>' +
          (stats ? '<dl class="feat__stats">' + stats + '</dl>' : '') +
          '<div class="feat__actions">' + actions(e) + '</div>' +
        '</div></article>';
    }).join('');
  }

  function renderRanks(list) {
    document.getElementById('rankList').innerHTML = list.map(function (e) {
      return '<li class="rank" data-open="' + esc(e.id) + '" tabindex="0">' +
        '<span class="rank__n">' + String(e.rank).padStart(2, '0') + '</span>' +
        media(e) +
        '<div><h3 class="rank__title">' + esc(shortTitle(e.title)) + '</h3><p class="rank__why">' + esc(e.why) + '</p></div>' +
        '<span class="rank__date">' + esc(fmtDate(e)) + '<br/>' + esc(place(e)) + '</span>' +
      '</li>';
    }).join('');
  }

  function renderWatch(videos, channels) {
    var grid = document.getElementById('watchGrid');
    grid.innerHTML = videos.map(function (v) {
      return '<button class="vid" type="button" data-video="' + esc(v.id) + '">' +
        '<div class="vid__thumb"><img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy"/>' +
          '<span class="vid__play">' + PLAY + '</span><span class="vid__len">' + esc(v.length) + '</span></div>' +
        '<h3 class="vid__title">' + esc(v.title) + '</h3>' +
        '<div class="vid__meta">' + esc(v.viewsLabel) + ' views · ' + esc(v.channel) + '</div>' +
      '</button>';
    }).join('');
    var more = document.createElement('div');
    more.className = 'watch__more';
    more.innerHTML = channels.map(function (c) {
      return '<a class="btn btn--line btn--sm" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.name) + ' ' + ARROW + '</a>';
    }).join('');
    grid.after(more);
  }

  function renderChips(events) {
    var counts = { All: events.length };
    events.forEach(function (e) { counts[e.format] = (counts[e.format] || 0) + 1; });
    var formats = ['All'].concat(FORMAT_ORDER.filter(function (f) { return counts[f]; }));
    var el = document.getElementById('chips');
    el.innerHTML = formats.map(function (f) {
      return '<button class="chip" type="button" data-format="' + esc(f) + '" aria-pressed="' + (f === state.format) + '">' +
        esc(f === 'All' ? 'All events' : FORMAT_LABEL[f] || f) + '<span>' + counts[f] + '</span></button>';
    }).join('');
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip');
      if (!b) return;
      state.format = b.dataset.format;
      el.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b); });
      renderArchive();
    });
  }

  function matches(e) {
    if (state.format !== 'All' && e.format !== state.format) return false;
    if (!state.q) return true;
    var hay = [e.title, e.speakers, e.summary, e.venue, e.city, e.format].join(' ').toLowerCase();
    return state.q.split(/\s+/).every(function (t) { return hay.indexOf(t) !== -1; });
  }

  function renderArchive() {
    var groups = {}, years = [];
    data.events.filter(matches).forEach(function (e) {
      var y = e.year || 'Earlier';
      if (!groups[y]) { groups[y] = []; years.push(y); }
      groups[y].push(e);
    });
    document.getElementById('archiveList').innerHTML = years.map(function (y) {
      return '<div class="year"><div class="year__label">' + esc(y) + '</div><div class="cards">' +
        groups[y].map(function (e) {
          return '<button class="card" type="button" data-open="' + esc(e.id) + '">' + media(e) +
            '<div class="card__meta"><span class="fmt">' + esc(e.format) + '</span><span>' + esc(fmtDate(e)) + '</span></div>' +
            '<h3 class="card__title">' + esc(shortTitle(e.title)) + (e.rank ? '<span class="card__rank">#' + e.rank + '</span>' : '') + '</h3>' +
          '</button>';
        }).join('') + '</div></div>';
    }).join('');
    document.getElementById('empty').hidden = years.length > 0;
  }

  /* Modal */
  var modal = document.getElementById('modal');
  var modalBody = document.getElementById('modalBody');

  function openEvent(id) {
    var e = byId[id];
    if (!e) return;
    var facts = [e.format, fmtDate(e), e.venue || e.city].filter(Boolean).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('');
    modalBody.innerHTML = media(e) +
      '<div class="modal__content">' +
        (e.rank ? '<p class="eyebrow">#' + e.rank + ' by impact</p>' : '') +
        '<h3 id="modalTitle">' + esc(shortTitle(e.title)) + '</h3>' +
        '<div class="modal__facts">' + facts + '</div>' +
        (e.speakers ? '<p><strong>' + esc(e.speakers) + '</strong></p>' : '') +
        '<p>' + esc(e.body || e.summary || '') + '</p>' +
        (e.why ? '<p class="feat__why">' + esc(e.why) + '</p>' : '') +
        '<div class="feat__actions">' + actions(e) + '</div>' +
      '</div>';
    show();
  }

  function openVideo(vid) {
    var v = (data.watch || []).filter(function (w) { return w.id === vid; })[0];
    var ev = data.events.filter(function (e) { return e.video === vid; })[0];
    var title = v ? v.title : ev ? shortTitle(ev.title) : '';
    modalBody.innerHTML = '<div class="modal__video"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(vid) +
      '?autoplay=1&rel=0" title="' + esc(title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<div class="modal__content"><h3 id="modalTitle">' + esc(title) + '</h3>' +
      (v ? '<div class="modal__facts"><span>' + esc(v.viewsLabel) + ' views</span><span>' + esc(v.channel) + '</span></div>' : '') +
      '<div class="feat__actions"><a class="btn btn--line btn--sm" href="https://www.youtube.com/watch?v=' + encodeURIComponent(vid) + '" target="_blank" rel="noopener">Open on YouTube ' + ARROW + '</a></div></div>';
    show();
  }

  function show() {
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    modal.scrollTop = 0;
  }
  function close() {
    modal.close ? modal.close() : modal.removeAttribute('open');
  }
  modal.addEventListener('close', function () { modalBody.innerHTML = ''; });
  modal.addEventListener('click', function (ev) {
    if (ev.target === modal || ev.target.closest('[data-close]')) close();
  });

  document.addEventListener('click', function (ev) {
    if (ev.target.closest('a')) return;
    var v = ev.target.closest('[data-video]');
    if (v) { ev.preventDefault(); openVideo(v.dataset.video); return; }
    var o = ev.target.closest('[data-open]');
    if (o && !modal.contains(o)) openEvent(o.dataset.open);
  });
  document.addEventListener('keydown', function (ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[data-open][tabindex]')) {
      ev.preventDefault();
      openEvent(ev.target.dataset.open);
    }
  });

  var nav = document.querySelector('.nav');
  window.addEventListener('scroll', function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); }, { passive: true });

  function compact(n) { return n >= 1000 ? Math.floor(n / 1000) + 'K+' : String(n); }

  fetch('./data/events.json?v=20261023b')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      data = d;
      d.events.forEach(function (e) { byId[e.id] = e; });
      var ranked = d.events.filter(function (e) { return e.rank; }).sort(function (a, b) { return a.rank - b.rank; });
      renderTop5(ranked.slice(0, TOP));
      renderRanks(ranked.slice(TOP));
      renderWatch(d.watch || [], d.channels || []);
      renderChips(d.events);
      renderArchive();
      var s = d.stats || {};
      var set = function (k, v) { var el = document.querySelector('[data-stat="' + k + '"]'); if (el && v) el.textContent = v; };
      set('events', s.events ? Math.floor(s.events / 5) * 5 + '+' : null);
      set('cities', s.cities);
      set('views', s.views ? compact(s.views) : null);
    })
    .catch(function () {
      document.getElementById('top5List').innerHTML = '<p class="empty">Events could not be loaded. See them on <a href="https://luma.com/togetherfund">Luma</a>.</p>';
    });

  var search = document.getElementById('search');
  var t;
  search.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () { state.q = search.value.trim().toLowerCase(); renderArchive(); }, 120);
  });
})();
