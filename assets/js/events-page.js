(function () {
  'use strict';

  var swiperInstances = new Map();
  var expandedCategories = new Set();
  var categoryById = new Map();

  function quarterRank(quarter) {
    // Convert "Qn YYYY" into a sortable integer: year * 10 + quarter.
    var match = /^Q(\d)\s+(\d{4})$/i.exec(String(quarter || '').trim());
    if (!match) return 0;
    return parseInt(match[2], 10) * 10 + parseInt(match[1], 10);
  }

  function sortEventsNewestFirst(events) {
    return events.slice().sort(function (a, b) {
      return quarterRank(b.quarter) - quarterRank(a.quarter);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function eventAltText(event) {
    var name = event && event.name ? event.name : 'event';
    if (event.rawCategory === 'AMA') return 'Founder chat setting for ' + name;
    if (event.rawCategory === 'Hackathon') return 'Builders coding together at ' + name;
    if (event.rawCategory === 'Meetup') return 'Community gathering for ' + name;
    if (event.rawCategory === 'Podcast') return 'Podcast recording for ' + name;
    if (event.rawCategory === 'Workshop') return 'Workshop session for ' + name;
    return 'Event setting for ' + name;
  }

  function cardTemplate(event, options) {
    options = options || {};
    var asGridCard = !!options.asGridCard;
    // Quarter intentionally omitted — the timeline (Q3 2025 etc.) is no longer
    // shown on event cards. Only the location displays as meta now.
    var metaParts = [event.location].filter(Boolean);
    var href = event.externalLink || '#';
    var hasExternal = event.externalLink && event.externalLink !== '#';
    var linkAttrs = hasExternal
      ? ' target="_blank" rel="noopener"'
      : ' aria-disabled="true" data-empty-link';
    var rootClasses = 'news_slider_item events_card';
    if (!asGridCard) rootClasses += ' swiper-slide';
    else rootClasses += ' events_grid_card';

    var featuredRow = event.featured
      ? '<div class="events_card_featured text-size-small">' + escapeHtml(event.featured) + '</div>'
      : '';

    return [
      '<div class="' + rootClasses + '" data-event-id="' + escapeHtml(event.id) + '">',
      '  <div class="events_card_visual">',
      '    <img class="news_slider_img events_card_img" src="' + escapeHtml(event.heroPhoto) + '" alt="' + escapeHtml(eventAltText(event)) + '" loading="lazy"/>',
      '  </div>',
      '  <div class="events_card_body">',
      '    <div class="events_card_meta text-size-small">' + escapeHtml(metaParts.join(' \u00B7 ')) + '</div>',
      '    <h3 class="events_card_heading heading-style-h6">' + escapeHtml(event.name) + '</h3>',
      '    <p class="events_card_copy text-size-regular">' + escapeHtml(event.shortDescription) + '</p>',
           featuredRow,
      '    <a href="' + escapeHtml(href) + '" class="events_card_link news_slider_link"' + linkAttrs + '>',
      '      <span class="events_card_link_text" data-text="Read More">Read More</span>',
      '      <span class="events_card_link_arrow" aria-hidden="true">',
      '        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M3 8h10M9 4l4 4-4 4"/>',
      '        </svg>',
      '      </span>',
      '    </a>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function initEventsSwiper(root) {
    if (!window.Swiper) return null;
    var wrap = root.closest('.events_slider_wrap') || root.parentElement;
    var prev = wrap.querySelector('.events_slider_arrow.is-prev');
    var next = wrap.querySelector('.events_slider_arrow.is-next');
    var dragEl = wrap.querySelector('.events_slider_dragable .events_slider_drag');

    function updateArrows(instance) {
      if (!instance) return;
      if (prev) prev.classList.toggle('is-disabled', !!instance.isBeginning);
      if (next) next.classList.toggle('is-disabled', !!instance.isEnd);
    }

    if (swiperInstances.has(root)) {
      swiperInstances.get(root).destroy(true, true);
      swiperInstances.delete(root);
    }

    var swiper = new Swiper(root, {
      slidesPerView: 1,
      spaceBetween: 16,
      speed: 700,
      grabCursor: true,
      mousewheel: { forceToAxis: true, sensitivity: 0.6, releaseOnEdges: true },
      scrollbar: dragEl ? {
        el: dragEl.parentElement,
        dragClass: 'events_slider_drag',
        draggable: true,
        hide: false
      } : false,
      breakpoints: {
        768: { slidesPerView: 1.4, spaceBetween: 20 },
        1024: { slidesPerView: 1.8, spaceBetween: 24 },
        1280: { slidesPerView: 2, spaceBetween: 24 }
      },
      on: {
        init: function () { updateArrows(this); },
        slideChange: function () { updateArrows(this); },
        resize: function () { updateArrows(this); },
        reachBeginning: function () { updateArrows(this); },
        reachEnd: function () { updateArrows(this); }
      }
    });

    if (prev) {
      prev.addEventListener('click', function () { swiper.slidePrev(); });
    }
    if (next) {
      next.addEventListener('click', function () { swiper.slideNext(); });
    }

    updateArrows(swiper);
    swiperInstances.set(root, swiper);
    return swiper;
  }

  function destroySwiperFor(root) {
    if (swiperInstances.has(root)) {
      swiperInstances.get(root).destroy(true, true);
      swiperInstances.delete(root);
    }
  }

  function renderCategory(categoryId) {
    var category = categoryById.get(categoryId);
    if (!category) return;

    var block = document.querySelector('[data-category-block="' + categoryId + '"]');
    if (!block) return;

    var titleEl = block.querySelector('[data-category-title]');
    var descEl = block.querySelector('[data-category-description]');
    if (titleEl) titleEl.textContent = category.name;
    if (descEl) descEl.textContent = category.description;

    var swiperRoot = block.querySelector('[data-events-swiper="' + categoryId + '"]');
    var track = block.querySelector('[data-events-track]');
    var grid = block.querySelector('[data-events-grid="' + categoryId + '"]');
    var dragable = block.querySelector('.events_slider_dragable');
    var arrowPrev = block.querySelector('.events_slider_arrow.is-prev');
    var arrowNext = block.querySelector('.events_slider_arrow.is-next');
    var seeAll = block.querySelector('[data-see-all="' + categoryId + '"]');
    var seeAllText = seeAll ? seeAll.querySelector('[data-see-all-text]') : null;

    var sorted = sortEventsNewestFirst(category.events || []);
    if (!sorted.length) {
      if (track) track.innerHTML = '<div class="events_empty text-size-regular">No events found.</div>';
      if (seeAll) seeAll.hidden = true;
      return;
    }

    var isExpanded = expandedCategories.has(categoryId);

    if (track) {
      track.innerHTML = sorted.map(function (event) {
        return cardTemplate(event, { asGridCard: false });
      }).join('');
    }
    if (grid) {
      grid.innerHTML = sorted.map(function (event) {
        return cardTemplate(event, { asGridCard: true });
      }).join('');
    }

    if (isExpanded) {
      if (swiperRoot) swiperRoot.hidden = true;
      if (dragable) dragable.hidden = true;
      if (arrowPrev) arrowPrev.hidden = true;
      if (arrowNext) arrowNext.hidden = true;
      if (grid) grid.hidden = false;
      destroySwiperFor(swiperRoot);
    } else {
      if (swiperRoot) swiperRoot.hidden = false;
      if (dragable) dragable.hidden = false;
      if (arrowPrev) arrowPrev.hidden = false;
      if (arrowNext) arrowNext.hidden = false;
      if (grid) grid.hidden = true;
      if (swiperRoot) initEventsSwiper(swiperRoot);
    }

    if (seeAll && seeAllText) {
      seeAll.setAttribute('aria-expanded', String(isExpanded));
      var collapsedLabel = seeAll.getAttribute('data-collapsed-label');
      if (!collapsedLabel) {
        collapsedLabel = seeAllText.textContent;
        seeAll.setAttribute('data-collapsed-label', collapsedLabel);
      }
      seeAllText.textContent = isExpanded
        ? 'Show less'
        : collapsedLabel;
    }
  }

  function wireSeeAllButtons() {
    var buttons = document.querySelectorAll('[data-see-all]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var categoryId = btn.getAttribute('data-see-all');
        if (expandedCategories.has(categoryId)) {
          expandedCategories.delete(categoryId);
        } else {
          expandedCategories.add(categoryId);
        }
        renderCategory(categoryId);
      });
    });
  }

  function wireSubscribeForm() {
    var form = document.querySelector('[data-subscribe-form]');
    if (!form) return;
    var success = document.querySelector('[data-subscribe-success]');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value || !input.checkValidity()) {
        input && input.focus();
        return;
      }
      form.hidden = true;
      if (success) success.hidden = false;
    });
  }

  function wireWhatTiles() {
    var tiles = document.querySelectorAll('[data-jump]');
    tiles.forEach(function (tile) {
      tile.addEventListener('click', function (event) {
        var targetId = tile.getAttribute('data-jump');
        var target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        var rect = target.getBoundingClientRect();
        var top = rect.top + window.pageYOffset - 24;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  function wireScrollToButtons() {
    var btns = document.querySelectorAll('[data-scroll-to]');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        var targetId = btn.getAttribute('data-scroll-to');
        var target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        var rect = target.getBoundingClientRect();
        var top = rect.top + window.pageYOffset - 24;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  function wireNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var links = document.querySelector('[data-nav-links]');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      links.classList.toggle('is-open');
    });
  }

  function loadEvents() {
    fetch('./data/events.json')
      .then(function (response) {
        if (!response.ok) throw new Error('Could not load events.json (status ' + response.status + ')');
        return response.json();
      })
      .then(function (data) {
        var categories = (data && data.categories) || [];
        categories.forEach(function (cat) {
          categoryById.set(cat.id, cat);
        });
        categories.forEach(function (cat) { renderCategory(cat.id); });
        wireSeeAllButtons();
      })
      .catch(function (error) {
        console.warn('[events-page]', error);
        var tracks = document.querySelectorAll('[data-events-track]');
        tracks.forEach(function (track) {
          track.innerHTML = '<div class="events_empty text-size-regular">Start a local server to load event data from <code>data/events.json</code>.</div>';
        });
      });
  }

  document.addEventListener('click', function (event) {
    var emptyLink = event.target.closest('[data-empty-link]');
    if (emptyLink) event.preventDefault();
  });

  function bootstrap() {
    wireNav();
    wireWhatTiles();
    wireScrollToButtons();
    wireSubscribeForm();
    loadEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
