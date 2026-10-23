/* Renders the Community page from data/events.json: speakers, programs and other events. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Isometric line drawings, in the style of the together.fund hero ---------- */
  var COS = Math.cos(Math.PI / 6), SIN = 0.5;
  function pt(x, y, z, o) { return [(o.cx + (x - y) * COS * o.u).toFixed(1), (o.cy + (x + y) * SIN * o.u - z * o.u).toFixed(1)].join(','); }
  function poly(pts, cls) { return '<polygon class="' + cls + '" points="' + pts.join(' ') + '"/>'; }
  // A box at (x, y, z) with width w (x), depth d (y) and height h (z); draws its three visible faces.
  function box(b, o) {
    var x = b[0], y = b[1], z = b[2], w = b[3], d = b[4], h = b[5];
    var top = [pt(x, y, z + h, o), pt(x + w, y, z + h, o), pt(x + w, y + d, z + h, o), pt(x, y + d, z + h, o)];
    var left = [pt(x, y + d, z, o), pt(x + w, y + d, z, o), pt(x + w, y + d, z + h, o), pt(x, y + d, z + h, o)];
    var right = [pt(x + w, y, z, o), pt(x + w, y + d, z, o), pt(x + w, y + d, z + h, o), pt(x + w, y, z + h, o)];
    return poly(left, 'f-l') + poly(right, 'f-r') + poly(top, 'f-t');
  }
  function line(a, b, o) {
    var p = pt(a[0], a[1], a[2], o).split(','), q = pt(b[0], b[1], b[2], o).split(',');
    return '<line class="ln" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>';
  }
  function scene(boxes, lines, o) {
    boxes = boxes.slice().sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
    return '<svg class="iso" viewBox="0 0 ' + o.w + ' ' + o.h + '" aria-hidden="true">' +
      (lines || []).map(function (l) { return line(l[0], l[1], o); }).join('') +
      boxes.map(function (b) { return box(b, o); }).join('') + '</svg>';
  }

  var ART = {
    // Ideas linked across a room: nodes on a grid, joined by traces.
    salon: function () {
      var o = { w: 520, h: 340, cx: 260, cy: 70, u: 22 };
      return scene(
        [[0, 0, 0, 2, 2, 3], [5, 0, 0, 2, 2, 1.5], [0, 5, 0, 2, 2, 1.5], [5, 5, 0, 2, 2, 4.5], [9, 2, 0, 1.5, 1.5, 2], [2, 9, 0, 1.5, 1.5, 2.5], [2.5, 2.5, 0, 2, 2, 0.6]],
        [[[1, 1, 0], [6, 1, 0]], [[1, 1, 0], [1, 6, 0]], [[6, 1, 0], [6, 6, 0]], [[1, 6, 0], [6, 6, 0]], [[6, 6, 0], [9.75, 2.75, 0]], [[6, 6, 0], [2.75, 9.75, 0]], [[1, 1, 0], [3.5, 3.5, 0]], [[3.5, 3.5, 0], [6, 6, 0]],
         [[-1, -1, 0], [12, -1, 0]], [[-1, -1, 0], [-1, 12, 0]]],
        o);
    },
    // A long build table with laptops and a tall stack of servers.
    hackathons: function () {
      var o = { w: 320, h: 220, cx: 150, cy: 52, u: 15 };
      return scene([[0, 0, 0, 8, 3, 1], [1, 0.6, 1, 1.6, 1.2, 0.5], [3.6, 0.6, 1, 1.6, 1.2, 0.5], [6, 0.6, 1, 1.4, 1.2, 0.5], [0, 5, 0, 2, 2, 5], [4, 5, 0, 2, 2, 2]], [[[1, 6, 0], [5, 6, 0]]], o);
    },
    // A stepped stage with a lectern.
    talks: function () {
      var o = { w: 320, h: 220, cx: 160, cy: 60, u: 15 };
      return scene([[0, 0, 0, 7, 7, 0.8], [1, 1, 0.8, 5, 5, 0.8], [2, 2, 1.6, 3, 3, 0.8], [3, 3, 2.4, 1, 1, 2.6]], [], o);
    },
    // A campus: a central hall with a clock tower, two wings and a quad in front.
    colleges: function () {
      var o = { w: 320, h: 220, cx: 158, cy: 40, u: 14 };
      return scene([
        [0, 0, 0, 9, 9, 0.25],          // quad
        [1, 1, 0.25, 7, 2.2, 2.4],      // main hall
        [3.6, 1.4, 2.65, 1.8, 1.4, 2.6],// clock tower
        [1, 3.6, 0.25, 2.2, 4.4, 1.8],  // west wing
        [5.8, 3.6, 0.25, 2.2, 4.4, 1.8] // east wing
      ], [], o);
    }
  };

  var ICON = {
    summit: function () { var o = { w: 80, h: 64, cx: 40, cy: 18, u: 6 }; return scene([[0, 0, 0, 5, 5, 1], [1, 1, 1, 3, 3, 1], [2, 2, 2, 1, 1, 1.4]], [], o); },
    fireside: function () { var o = { w: 80, h: 64, cx: 40, cy: 20, u: 6 }; return scene([[0, 0, 0, 2, 2, 2.5], [3.5, 3.5, 0, 2, 2, 2.5]], [[[2, 2, 0], [3.5, 3.5, 0]]], o); },
    workshop: function () { var o = { w: 80, h: 64, cx: 40, cy: 22, u: 6 }; return scene([[0, 0, 0, 6, 3, 0.8], [1, 0.7, 0.8, 1.4, 1.2, 0.5], [3.4, 0.7, 0.8, 1.4, 1.2, 0.5]], [], o); },
    mixer: function () { var o = { w: 80, h: 64, cx: 40, cy: 18, u: 6 }; return scene([[0, 0, 0, 1.5, 1.5, 2], [3.5, 0.5, 0, 1.5, 1.5, 1.4], [0.5, 3.5, 0, 1.5, 1.5, 1.4], [3.5, 3.5, 0, 1.5, 1.5, 2.4]], [], o); }
  };

  /* ---------- Speakers: cards behave like the together.fund portfolio cards ---------- */
  function renderSpeakers(list) {
    var grid = document.getElementById('speakerGrid');
    grid.innerHTML = list.map(function (s) {
      return '<li class="speaker">' +
        '<div class="speaker__card" tabindex="0" role="button" aria-expanded="false" aria-label="' + esc(s.name) + ', ' + esc(s.role) + '">' +
          '<span class="speaker__tag">' + esc(s.company) + '</span>' +
          '<img class="speaker__photo" src="' + esc(s.photo) + '" alt="" loading="lazy" decoding="async"/>' +
          '<div class="speaker__info">' +
            '<p class="speaker__bio">' + esc(s.bio) + '</p>' +
            '<div class="speaker__divider"></div>' +
            '<p class="speaker__info-name">' + esc(s.name) + '</p>' +
          '</div>' +
        '</div>' +
        '<p class="speaker__name">' + esc(s.name) + '</p>' +
        '<p class="speaker__role">' + esc(s.role) + '</p>' +
        '<p class="speaker__context">' + esc(s.context) + '</p>' +
      '</li>';
    }).join('');

    // Hover reveals the panel on desktop; tap or Enter toggles it, one card at a time.
    function toggle(card) {
      var open = card.classList.contains('is-open');
      grid.querySelectorAll('.speaker__card.is-open').forEach(function (c) { c.classList.remove('is-open'); c.setAttribute('aria-expanded', 'false'); });
      if (!open) { card.classList.add('is-open'); card.setAttribute('aria-expanded', 'true'); }
    }
    grid.addEventListener('click', function (ev) { var c = ev.target.closest('.speaker__card'); if (c) toggle(c); });
    grid.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList.contains('speaker__card')) { ev.preventDefault(); toggle(ev.target); }
    });
  }

  /* ---------- Logo strip: the list is rendered twice so the loop is seamless ---------- */
  function renderLogos(list) {
    var track = document.getElementById('logoTrack');
    if (!track || !list.length) return;
    var one = list.map(function (l) {
      return '<li class="marquee__item"><img src="' + esc(l.src) + '" alt="' + esc(l.name) + '" loading="lazy" decoding="async"/></li>';
    }).join('');
    track.innerHTML = one + one.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');
  }

  function stats(list, cls) {
    if (!list || !list.length) return '';
    return '<dl class="stats ' + (cls || '') + '">' + list.map(function (s) {
      return '<div><dt>' + esc(s.label) + '</dt><dd>' + esc(s.value) + '</dd></div>';
    }).join('') + '</dl>';
  }

  /* ---------- Programs ---------- */
  function renderSalon(s) {
    document.getElementById('salon').innerHTML =
      '<article class="salon reveal">' +
        '<div class="salon__text">' +
          '<p class="salon__kicker">' + esc(s.kicker) + '</p>' +
          '<h3 class="salon__name">' + esc(s.name) + '</h3>' +
          '<p class="salon__about">' + esc(s.about) + '</p>' +
          stats(s.stats, 'stats--salon') +
          '<p class="salon__label">Topics so far</p>' +
          '<ul class="topics">' + s.topics.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<div class="salon__art dark">' + ART.salon() + '</div>' +
      '</article>';
  }

  function renderPrograms(list) {
    document.getElementById('programs').innerHTML = list.map(function (p) {
      return '<article class="program reveal">' +
        '<div class="program__art dark">' + (ART[p.id] ? ART[p.id]() : '') + '</div>' +
        '<div class="program__body">' +
          '<h3 class="program__name">' + esc(p.name) + '</h3>' +
          '<p class="program__about">' + esc(p.about) + '</p>' +
          stats(p.stats) +
          (p.campuses
            ? '<ul class="campuses">' + p.campuses.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>'
            : '<ul class="program__items">' + p.items.map(function (i) {
                return '<li><span class="program__item">' + esc(i.name) + '</span><span class="program__detail">' + esc(i.detail) + '</span></li>';
              }).join('') + '</ul>') +
        '</div>' +
      '</article>';
    }).join('');
  }

  var GROUP_ICON = { firesides: 'fireside', builders: 'workshop', gatherings: 'summit' };
  function renderGroups(list) {
    document.getElementById('groups').innerHTML = list.map(function (g) {
      var icon = ICON[GROUP_ICON[g.id]];
      return '<section class="group reveal">' +
        '<div class="group__head"><span class="group__icon">' + (icon ? icon() : '') + '</span><h3 class="group__name">' + esc(g.name) + '</h3></div>' +
        '<ul class="group__list">' + g.events.map(function (e) {
          return '<li><span class="group__event">' + esc(e.name) + '</span><span class="group__about">' + esc(e.about) + '</span></li>';
        }).join('') + '</ul>' +
      '</section>';
    }).join('');
  }

  // Fade sections up as they enter the viewport; content stays visible if observers are unavailable.
  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { el.classList.add('is-pending'); io.observe(el); });
  }

  fetch('./data/events.json?v=20261023n')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      renderLogos(d.logos || []);
      renderSpeakers(d.speakers || []);
      if (d.salon) renderSalon(d.salon);
      renderPrograms(d.programs || []);
      renderGroups(d.groups || []);
      reveal();
    });

  // Mobile menu. On together.fund this runs on Webflow page interactions, which don't exist on
  // this page, so open the panel here; the site's own GSAP script still fades the links in.
  var navBtn = document.querySelector('.nav_button'), navMenu = document.querySelector('.nav_menu'), navBar = document.querySelector('.navbar');
  if (navBtn && navMenu && navBar) {
    navBtn.addEventListener('click', function () {
      var open = !navBar.classList.contains('is-menu-open');
      navBar.classList.toggle('is-menu-open', open);
      navMenu.style.height = open ? '100vh' : '0vh';
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
  }

  var y = document.getElementById('footer-year');
  if (y) y.textContent = new Date().getFullYear();
})();
