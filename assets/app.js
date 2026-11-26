/* E.ZY — site behaviour: language, header, reveal, works filter, units, lightbox */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  /* ---------------- language ---------------- */
  var STORE = 'ezy-lang';
  var titles = {
    'index.html':   { en: 'E.ZY — Lee Ji Hwan', kr: 'E.ZY 이지환' },
    'works.html':   { en: 'Works — E.ZY', kr: '작품 — E.ZY' },
    'series.html':  { en: 'Series — E.ZY', kr: '연작 — E.ZY' },
    'archive.html': { en: 'Archive — E.ZY', kr: '아카이브 — E.ZY' },
    'about.html':   { en: 'About — E.ZY', kr: '소개 — E.ZY' }
  };
  var page = (location.pathname.split('/').pop() || 'index.html');

  function readLang() {
    try {
      var s = localStorage.getItem(STORE);
      if (s === 'kr' || s === 'en') return s;
    } catch (e) {}
    return (navigator.language || 'en').toLowerCase().indexOf('ko') === 0 ? 'kr' : 'en';
  }

  function setLang(lang, save) {
    var isKr = lang === 'kr';
    docEl.lang = isKr ? 'ko' : 'en';
    docEl.setAttribute('data-lang', lang);
    var nodes = document.querySelectorAll('[data-kr][data-en]');
    for (var i = 0; i < nodes.length; i++) {
      var v = nodes[i].getAttribute(isKr ? 'data-kr' : 'data-en');
      if (v !== null) nodes[i].textContent = v;
    }
    var t = titles[page];
    if (t) document.title = (isKr ? t.kr : t.en) + (page === 'index.html' ? (isKr ? ' — 회화 · 구조 · 의식의 위임' : ' — Painting, Structure, Consciousness') : '');
    var be = document.getElementById('lang-en'), bk = document.getElementById('lang-kr');
    if (be) be.setAttribute('aria-pressed', isKr ? 'false' : 'true');
    if (bk) bk.setAttribute('aria-pressed', isKr ? 'true' : 'false');
    if (save) { try { localStorage.setItem(STORE, lang); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  var lang = readLang();
  setLang(lang, false);
  var be = document.getElementById('lang-en'), bk = document.getElementById('lang-kr');
  if (be) be.addEventListener('click', function () { setLang('en', true); });
  if (bk) bk.addEventListener('click', function () { setLang('kr', true); });

  /* ---------------- header ---------------- */
  var head = document.getElementById('head');
  if (head && head.dataset.transparent === 'true') {
    var onScroll = function () {
      if (window.scrollY > 24) head.classList.add('solid');
      else head.classList.remove('solid');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- mobile menu ---------------- */
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menu-btn');
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    docEl.classList.remove('menu-open');
    if (typeof setMenuLabel === 'function') setMenuLabel(false);
    document.body.style.overflow = '';
  }
  function setMenuLabel(open) {
    var span = menuBtn.querySelector('span');
    if (!span) return;
    span.setAttribute('data-en', open ? 'Close' : 'Menu');
    span.setAttribute('data-kr', open ? '닫기' : '메뉴');
    var isKr = docEl.getAttribute('data-lang') === 'kr';
    span.textContent = span.getAttribute(isKr ? 'data-kr' : 'data-en');
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      docEl.classList.toggle('menu-open', open);
      setMenuLabel(open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------------- reveal ---------------- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    for (var i = 0; i < rv.length; i++) io.observe(rv[i]);
  } else {
    for (var j = 0; j < rv.length; j++) rv[j].classList.add('in');
  }

  /* ---------------- works page ---------------- */
  var grid = document.getElementById('works-grid');
  if (!grid || !window.WORKS) return;

  var works = window.WORKS;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.work-card'));
  var unit = 'cm';
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));

  function mm(v) { return Math.round(v * 10) / 10; }
  function toIn(v) {
    var x = v * 0.3937008;
    var r = Math.round(x * 10) / 10;
    return (r % 1 === 0) ? String(r) : r.toFixed(1);
  }
  function sizeText(w, h, u) {
    if (u === 'in') return toIn(w) + ' × ' + toIn(h) + ' in';
    return mm(w) + ' × ' + mm(h) + ' cm';
  }

  function applyUnit(u) {
    unit = u;
    var sizes = document.querySelectorAll('[data-size]');
    for (var i = 0; i < sizes.length; i++) {
      sizes[i].textContent = sizeText(parseFloat(sizes[i].dataset.w), parseFloat(sizes[i].dataset.h), u);
    }
    var uc = document.getElementById('unit-cm'), ui = document.getElementById('unit-in');
    if (uc) uc.setAttribute('aria-pressed', u === 'cm' ? 'true' : 'false');
    if (ui) ui.setAttribute('aria-pressed', u === 'in' ? 'true' : 'false');
    if (lb.classList.contains('open')) render(lbIndex);
  }
  var ucm = document.getElementById('unit-cm'), uin = document.getElementById('unit-in');
  if (ucm) ucm.addEventListener('click', function () { applyUnit('cm'); });
  if (uin) uin.addEventListener('click', function () { applyUnit('in'); });

  /* filters */
  var activeFilter = 'all';
  function visibleIndices() {
    var out = [];
    for (var i = 0; i < works.length; i++) {
      if (activeFilter === 'all' || works[i].series === activeFilter) out.push(i);
    }
    return out;
  }
  function applyFilter(key) {
    activeFilter = key;
    var visible = 0;
    cards.forEach(function (c) {
      var on = (key === 'all' || c.dataset.series === key);
      c.classList.toggle('is-hidden', !on);
      if (on) {
        c.classList.add('in');
        visible++;
      }
    });
    filters.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === key ? 'true' : 'false'); });
    var count = document.getElementById('visible-count');
    if (count) count.textContent = visible;
  }
  filters.forEach(function (b) {
    b.addEventListener('click', function () { applyFilter(b.dataset.filter); });
  });

  /* ---------------- lightbox ---------------- */
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbTitle = document.getElementById('lb-title');
  var lbAlt = document.getElementById('lb-alt');
  var lbCount = document.getElementById('lb-count');
  var lbSeries = document.getElementById('lb-series');
  var lbMedium = document.getElementById('lb-medium');
  var lbSize = document.getElementById('lb-size');
  var lbYear = document.getElementById('lb-year');
  var lbNote = document.getElementById('lb-note');
  var lbInquire = document.getElementById('lb-inquire');
  var lbIndex = -1;
  var lastFocus = null;

  function langNow() { return docEl.getAttribute('data-lang') === 'kr' ? 'kr' : 'en'; }

  function render(i) {
    var w = works[i];
    lbIndex = i;
    lbImg.src = w.img;
    lbImg.alt = w.title_en + ', ' + w.year;
    lbTitle.textContent = langNow() === 'kr' ? w.title_kr : w.title_en;
    lbAlt.textContent = langNow() === 'kr' ? w.title_en : w.title_kr;
    lbCount.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + works.length).slice(-2);
    lbSeries.textContent = langNow() === 'kr' ? w.series_kr : w.series_en;
    lbMedium.textContent = langNow() === 'kr' ? w.medium_kr : w.medium_en;
    lbSize.textContent = sizeText(w.w, w.h, unit);
    lbYear.textContent = w.year;
    lbNote.textContent = langNow() === 'kr' ? w.note_kr : w.note_en;
    if (lbInquire) {
      var subj = (langNow() === 'kr' ? '[작품 문의] ' + w.title_kr : 'Inquiry: ' + w.title_en) + ' (' + w.year + ', ' + sizeText(w.w, w.h, unit) + ')';
      lbInquire.href = 'mailto:e.zy@kakao.com?subject=' + encodeURIComponent(subj);
      lbInquire.textContent = langNow() === 'kr' ? '작품 문의 →' : 'Inquire about this work →';
    }
  }

  function open(i) {
    lastFocus = document.activeElement;
    render(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.setAttribute('tabindex', '-1');
    lb.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', '#' + works[i].id);
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function step(d) {
    var vis = visibleIndices();
    if (!vis.length) vis = [lbIndex];
    var pos = vis.indexOf(lbIndex);
    var nextIdx = pos === -1 ? vis[0] : vis[(pos + d + vis.length) % vis.length];
    render(nextIdx);
    if (history.replaceState) history.replaceState(null, '', '#' + works[lbIndex].id);
  }

  cards.forEach(function (card) {
    var btn = card.querySelector('.ph');
    var idx = parseInt(card.dataset.index, 10);
    if (!btn) return;
    btn.addEventListener('click', function () { open(idx); });
  });

  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

  var tx = 0;
  var lbStage = lb.querySelector('.lb-stage');
  if (lbStage) {
    lbStage.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    lbStage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowLeft') { step(-1); }
    else if (e.key === 'ArrowRight') { step(1); }
  });

  document.addEventListener('langchange', function () {
    if (lb.classList.contains('open')) render(lbIndex);
  });

  /* deep link */
  if (location.hash) {
    var id = location.hash.slice(1);
    for (var k = 0; k < works.length; k++) {
      if (works[k].id === id) { open(k); break; }
    }
  }
})();
