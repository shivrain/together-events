(function () {
  'use strict';

  var swiperInstances = new Map();
  var expandedCategories = new Set();
  var categoryById = new Map();
  var eventsById = new Map();          // id -> full event object (for the modal)
  var featuredSwiperInstance = null;
  var lastFocusBeforeModal = null;

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
    var rootClasses = 'news_slider_item events_card is-clickable';
    if (!asGridCard) rootClasses += ' swiper-slide';
    else rootClasses += ' events_grid_card';

    // Whole card is the modal trigger now. No separate Read More button,
    // no featured/co-host line \u2014 those were redundant noise on cards.
    return [
      '<div class="' + rootClasses + '" data-event-id="' + escapeHtml(event.id) + '" data-open-event-modal="' + escapeHtml(event.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml('Open details for ' + event.name) + '">',
      '  <div class="events_card_visual" style="--card-bg:url(\'' + escapeHtml(event.heroPhoto) + '\')">',
      '    <img class="news_slider_img events_card_img" src="' + escapeHtml(event.heroPhoto) + '" alt="' + escapeHtml(eventAltText(event)) + '" loading="lazy"/>',
      '  </div>',
      '  <div class="events_card_body">',
      '    <div class="events_card_meta text-size-small">' + escapeHtml(metaParts.join(' \u00B7 ')) + '</div>',
      '    <h3 class="events_card_heading heading-style-h6">' + escapeHtml(event.name) + '</h3>',
      '    <p class="events_card_copy text-size-regular">' + escapeHtml(event.shortDescription) + '</p>',
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
      // Loop is on, so navigation never hits a hard edge — keep both
      // arrows enabled at all times for the circular feel.
      if (prev) prev.classList.remove('is-disabled');
      if (next) next.classList.remove('is-disabled');
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
      // Continuous loop: dragging or arrowing past the last card wraps
      // back to the first. Mousewheel is intentionally NOT enabled — with
      // loop it would trap page scroll and never release.
      loop: true,
      loopAdditionalSlides: 4,
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
        resize: function () { updateArrows(this); }
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

  // ============================================================
  // FEATURED EVENTS — single-card layout (image left, content right)
  // with prev/next arrows that step through one featured event at a
  // time. The whole card is still the modal trigger.
  // ============================================================
  function featuredCardTemplate(entry, event) {
    var displayName = entry.displayName || event.name;
    var displayDesc = entry.displayDescription || event.shortDescription;
    var img = entry.heroPhoto || event.heroPhoto;
    return [
      '<div class="swiper-slide events_featured_slide" data-open-event-modal="' + escapeHtml(event.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml('Open details for ' + displayName) + '">',
      '  <div class="events_featured_grid">',
      '    <div class="events_featured_visual events_card_visual" style="--card-bg:url(\'' + escapeHtml(img) + '\')">',
      '      <img class="events_card_img" src="' + escapeHtml(img) + '" alt="' + escapeHtml(eventAltText(event)) + '" loading="lazy"/>',
      '    </div>',
      '    <div class="events_featured_body">',
      '      <div class="events_featured_chip">Featured</div>',
      '      <h2 class="events_featured_heading heading-style-h4">' + escapeHtml(displayName) + '</h2>',
      '      <div class="events_featured_meta text-size-small">' + escapeHtml(event.location || '') + '</div>',
      '      <p class="events_featured_copy text-size-large">' + escapeHtml(displayDesc) + '</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function renderFeatured(featuredEntries) {
    var track = document.querySelector('[data-featured-swiper-track]');
    if (!track) return;
    if (!Array.isArray(featuredEntries) || !featuredEntries.length) {
      var section = track.closest('.events_featured_section');
      if (section) section.hidden = true;
      return;
    }
    var html = featuredEntries.map(function (entry) {
      var event = eventsById.get(entry.id);
      if (!event) return '';
      return featuredCardTemplate(entry, event);
    }).filter(Boolean).join('');
    track.innerHTML = html;

    if (!window.Swiper) return;
    var root = document.querySelector('[data-featured-swiper]');
    var prev = document.querySelector('[data-featured-prev]');
    var next = document.querySelector('[data-featured-next]');

    if (featuredSwiperInstance) {
      featuredSwiperInstance.destroy(true, true);
      featuredSwiperInstance = null;
    }

    function updateArrows(inst) {
      // Loop is on — both arrows always enabled (circular navigation).
      if (prev) prev.classList.remove('is-disabled');
      if (next) next.classList.remove('is-disabled');
    }

    featuredSwiperInstance = new Swiper(root, {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 700,
      grabCursor: true,
      // Continuous loop: arrowing or dragging past the last featured event
      // wraps back to the first. No mousewheel (would trap page scroll).
      loop: true,
      loopAdditionalSlides: 2,
      on: {
        init: function () { updateArrows(this); },
        slideChange: function () { updateArrows(this); },
        resize: function () { updateArrows(this); }
      }
    });

    // The arrows live inside the card area; stop their clicks from
    // bubbling to the slide's modal trigger.
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); featuredSwiperInstance.slidePrev(); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); featuredSwiperInstance.slideNext(); });
    updateArrows(featuredSwiperInstance);
  }

  // ============================================================
  // EVENT DETAIL MODAL
  // ============================================================
  function openModal(eventId) {
    var modal = document.querySelector('[data-event-modal]');
    if (!modal) return;
    var event = eventsById.get(eventId);
    if (!event) return;

    var titleEl    = modal.querySelector('[data-event-modal-title]');
    var metaEl     = modal.querySelector('[data-event-modal-meta]');
    var descEl     = modal.querySelector('[data-event-modal-description]');
    var imgEl      = modal.querySelector('[data-event-modal-img]');
    var visualEl   = modal.querySelector('.events_modal_visual');
    var chipEl     = modal.querySelector('[data-event-modal-chip]');
    var lumaEl     = modal.querySelector('[data-event-modal-luma]');

    if (titleEl)    titleEl.textContent = event.name;
    if (metaEl)     metaEl.textContent = event.location || '';
    if (descEl)     descEl.textContent = event.longDescription || event.shortDescription || '';
    if (chipEl)     chipEl.textContent = (event.rawCategory || '').toUpperCase();
    if (imgEl) {
      imgEl.src = event.heroPhoto || '';
      imgEl.alt = eventAltText(event);
    }
    // Blurred backdrop fill for the modal image (matches the card treatment).
    if (visualEl) visualEl.style.setProperty('--card-bg', "url('" + (event.heroPhoto || '') + "')");
    if (lumaEl) {
      var hasLink = event.externalLink && event.externalLink !== '#';
      lumaEl.setAttribute('href', hasLink ? event.externalLink : '#');
      if (hasLink) {
        lumaEl.removeAttribute('data-empty-link');
      } else {
        lumaEl.setAttribute('data-empty-link', '');
      }
    }

    lastFocusBeforeModal = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('events-modal-open');
    var closeBtn = modal.querySelector('.events_modal_close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    var modal = document.querySelector('[data-event-modal]');
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('events-modal-open');
    setTimeout(function () {
      modal.hidden = true;
      if (lastFocusBeforeModal && lastFocusBeforeModal.focus) {
        lastFocusBeforeModal.focus();
      }
    }, 300);
  }

  function wireModal() {
    // Open on any trigger
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-open-event-modal]');
      if (!trigger) return;
      e.preventDefault();
      openModal(trigger.getAttribute('data-open-event-modal'));
    });
    // Open via Enter/Space on keyboard-focused trigger
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var trigger = e.target.closest('[data-open-event-modal]');
      if (!trigger || trigger.tagName === 'BUTTON') return; // buttons handle Space themselves
      e.preventDefault();
      openModal(trigger.getAttribute('data-open-event-modal'));
    });
    // Close handlers
    document.querySelectorAll('[data-event-modal-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
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
          (cat.events || []).forEach(function (ev) { eventsById.set(ev.id, ev); });
        });
        categories.forEach(function (cat) { renderCategory(cat.id); });
        wireSeeAllButtons();
        renderFeatured(data && data.featuredEvents);
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
    wireModal();
    loadEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
