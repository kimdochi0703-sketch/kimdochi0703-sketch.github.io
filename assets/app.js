/* E.ZY — site behaviour
   language · header · menu · reveal · the room · works filter · lightbox */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');
  var page = (location.pathname.split('/').pop() || 'index.html');

  /* ---------------- language ---------------- */
  var STORE = 'ezy-lang';
  var titles = {
    'index.html':   { en: 'E.ZY — Lee Ji Hwan', kr: 'E.ZY — 이지환' },
    'works.html':   { en: 'Works — E.ZY', kr: '작품 — E.ZY' },
    'series.html':  { en: 'Series — E.ZY', kr: '연작 — E.ZY' },
    'archive.html': { en: 'Archive — E.ZY', kr: '아카이브 — E.ZY' },
    'about.html':   { en: 'About — E.ZY', kr: '소개 — E.ZY' },
    '404.html':     { en: 'Page not found — E.ZY', kr: '페이지를 찾을 수 없습니다 — E.ZY' }
  };

  function readLang() {
    try {
      var s = localStorage.getItem(STORE);
      if (s === 'kr' || s === 'en') return s;
    } catch (e) {}
    return (navigator.language || 'en').toLowerCase().indexOf('ko') === 0 ? 'kr' : 'en';
  }
  function langNow() { return docEl.getAttribute('data-lang') === 'kr' ? 'kr' : 'en'; }

  function setLang(lang, save) {
    var isKr = lang === 'kr';
    docEl.lang = isKr ? 'ko' : 'en';
    docEl.setAttribute('data-lang', lang);
    var nodes = document.querySelectorAll('[data-kr][data-en]');
    for (var i = 0; i < nodes.length; i++) {
      var v = nodes[i].getAttribute(isKr ? 'data-kr' : 'data-en');
      if (v !== null) nodes[i].textContent = v;
    }
    var desc = document.getElementById('meta-desc');
    if (desc) desc.setAttribute('content', desc.getAttribute(isKr ? 'data-kr' : 'data-en') || '');
    var t = titles[page] || (document.body && document.body.dataset.titleEn
      ? { en: document.body.dataset.titleEn, kr: document.body.dataset.titleKr }
      : null);
    if (t) {
      document.title = isKr ? t.kr : t.en;
      var og = document.querySelector('meta[property="og:title"]');
      if (og) og.setAttribute('content', isKr ? t.kr : t.en);
    }
    var be = document.getElementById('lang-en'), bk = document.getElementById('lang-kr');
    if (be) be.setAttribute('aria-pressed', isKr ? 'false' : 'true');
    if (bk) bk.setAttribute('aria-pressed', isKr ? 'true' : 'false');
    Array.prototype.forEach.call(document.querySelectorAll('[data-set-lang]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
    if (save) { try { localStorage.setItem(STORE, lang); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  setLang(readLang(), false);
  var be = document.getElementById('lang-en'), bk = document.getElementById('lang-kr');
  if (be) be.addEventListener('click', function () { setLang('en', true); });
  if (bk) bk.addEventListener('click', function () { setLang('kr', true); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-set-lang]'), function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); });
  });

  /* ---------------- header · three states ----------------
     room (transparent) / sliding down (hidden) / sliding up (opaque bar) */
  var head = document.getElementById('head');
  if (head) {
    var headAnchor = window.scrollY || 0;   // position of the last state change
    var headTick = false;
    var paintHead = function () {
      headTick = false;
      var y = window.scrollY || 0;
      if (y <= 10) {
        head.classList.remove('is-hidden');
        head.classList.remove('is-solid');
        headAnchor = y;
      } else if (y > headAnchor + 6) {
        head.classList.add('is-solid');
        if (y > 72) head.classList.add('is-hidden');
        headAnchor = y;
      } else if (y < headAnchor - 6) {
        head.classList.remove('is-hidden');
        head.classList.add('is-solid');
        headAnchor = y;
      }
    };
    var queueHead = function () {
      if (headTick) return;
      headTick = true;
      requestAnimationFrame(paintHead);
    };
    if ((window.scrollY || 0) > 10) head.classList.add('is-solid');
    paintHead();
    window.addEventListener('scroll', queueHead, { passive: true });
  }

  /* ---------------- mobile menu ---------------- */
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menu-btn');
  function setMenuLabel(open) {
    if (!menuBtn) return;
    var span = menuBtn.querySelector('span');
    if (!span) return;
    span.setAttribute('data-en', open ? 'Close' : 'Menu');
    span.setAttribute('data-kr', open ? '닫기' : '메뉴');
    span.textContent = span.getAttribute(langNow() === 'kr' ? 'data-kr' : 'data-en');
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    docEl.classList.remove('menu-open');
    setMenuLabel(false);
    document.body.style.overflow = '';
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      docEl.classList.toggle('menu-open', open);
      setMenuLabel(open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('langchange', function () { setMenuLabel(menu.classList.contains('open')); });
  }

  /* ---------------- reveal ---------------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealRaf = 0;
  function revealInView() {
    if (!rvs.length) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    rvs = rvs.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > -vh * 0.1) { el.classList.add('in'); return false; }
      return true;
    });
    if (!rvs.length) window.removeEventListener('scroll', onScrollReveal);
  }
  function onScrollReveal() {
    if (revealRaf) return;
    revealRaf = requestAnimationFrame(function () { revealRaf = 0; revealInView(); });
  }
  if (reduce) {
    rvs.forEach(function (el) { el.classList.add('in'); });
    rvs = [];
  } else {
    revealInView();
    window.addEventListener('scroll', onScrollReveal, { passive: true });
    window.addEventListener('resize', onScrollReveal, { passive: true });
    window.addEventListener('load', revealInView);
  }

  /* ---------------- the room: work to work ---------------- */
  var roomImg = document.getElementById('room-img');
  if (roomImg) {
    var ROOM = [
      {
        img: 'assets/images/hero-cc-14.jpg', w: 2099, h: 1467, href: 'works.html#cc-14',
        t_en: 'Delegated Consciousness – No.14', t_kr: '위임된 의식 14',
        m_en: 'Oil pastel on paper · 38 × 54 cm', m_kr: '종이에 오일파스텔 · 38 × 54 cm',
        year: '2026'
      },
      {
        img: 'assets/images/2026/cc-19.jpg', w: 1500, h: 1073, href: 'works.html#cc-19',
        t_en: 'Delegated Consciousness – No.19 (Metro)', t_kr: '위임된 의식 19 (전철)',
        m_en: 'Oil pastel on paper · 38 × 54 cm', m_kr: '종이에 오일파스텔 · 38 × 54 cm',
        year: '2026'
      },
      {
        img: 'assets/images/2026/cc-18.jpg', w: 1500, h: 1050, href: 'works.html#cc-18',
        t_en: 'Delegated Consciousness – No.18', t_kr: '위임된 의식 18',
        m_en: 'Oil pastel on paper · 38 × 54 cm', m_kr: '종이에 오일파스텔 · 38 × 54 cm',
        year: '2026'
      }
    ];
    var roomFigure = document.getElementById('room-figure');
    var roomLink = document.getElementById('room-link');
    var roomTitle = document.getElementById('room-title');
    var roomMedium = document.getElementById('room-medium');
    var roomYear = document.getElementById('room-year');
    var roomNext = document.getElementById('room-next');
    var roomIndex = 0;
    var roomBusy = false;

    ROOM.forEach(function (r, i) { if (i) { var im = new Image(); im.src = r.img; } });

    function paintRoom(i) {
      var r = ROOM[i];
      var k = langNow();
      roomFigure.classList.add('swapping');
      window.setTimeout(function () {
        roomImg.src = r.img;
        roomImg.width = r.w;
        roomImg.height = r.h;
        roomImg.alt = (k === 'kr' ? r.t_kr : r.t_en) + ', ' + r.year;
        roomLink.href = r.href;
        roomLink.setAttribute('aria-label', (k === 'kr' ? r.t_kr : r.t_en) + ', ' + r.year);
        roomTitle.setAttribute('data-en', r.t_en);
        roomTitle.setAttribute('data-kr', r.t_kr);
        roomTitle.textContent = k === 'kr' ? r.t_kr : r.t_en;
        roomMedium.setAttribute('data-en', r.m_en);
        roomMedium.setAttribute('data-kr', r.m_kr);
        roomMedium.textContent = k === 'kr' ? r.m_kr : r.m_en;
        roomYear.setAttribute('data-en', r.year);
        roomYear.setAttribute('data-kr', r.year);
        roomYear.textContent = r.year;
        roomFigure.classList.remove('swapping');
      }, 380);
    }
    if (roomNext) {
      roomNext.addEventListener('click', function () {
        if (roomBusy) return;
        roomBusy = true;
        roomIndex = (roomIndex + 1) % ROOM.length;
        paintRoom(roomIndex);
        window.setTimeout(function () { roomBusy = false; }, 700);
      });
    }
    document.addEventListener('langchange', function () {
      var r = ROOM[roomIndex];
      var k = langNow();
      roomImg.alt = (k === 'kr' ? r.t_kr : r.t_en) + ', ' + r.year;
      roomLink.setAttribute('aria-label', (k === 'kr' ? r.t_kr : r.t_en) + ', ' + r.year);
    });
  }

  /* ---------------- works page ----------------
     Three ways to look at the archive:
       · curated grid   — Selected: the two-column captioned grid, as before
       · justified wall — years / All / series: rows filled edge to edge, no black holes
       · text index     — four columns of type, 1,603 lines, for finding a work by name
     The wall is built from the data array, not from 1,603 figures in the HTML. */

  var grid = document.getElementById('works-grid');
  if (!grid || !window.WORKS) return;

  var works = window.WORKS;
  var wall = document.getElementById('works-wall');
  var indexBox = document.getElementById('works-index');
  var shortWrap = document.getElementById('short-groups');
  var albumCredits = document.getElementById('album-credits');
  var stripEl = document.getElementById('chapter-strip');
  var seriesRow = document.querySelector('.filters--series');
  var wlabel = document.getElementById('wlabel');

  var activeFilter = 'sel';
  var activeView = 'rows';
  var unit = 'cm';
  var YEARKEY = /^[0-9]{4}$/;

  function mm(v) { return Math.round(v * 10) / 10; }
  function toIn(v) {
    var r = Math.round(v * 0.3937008 * 10) / 10;
    return (r % 1 === 0) ? String(r) : r.toFixed(1);
  }
  function sizeText(w, h, u) {
    if (w == null || h == null) return null;
    if (u === 'in') return toIn(w) + ' × ' + toIn(h) + ' in';
    return mm(w) + ' × ' + mm(h) + ' cm';
  }
  function sizeBoth(w, h) {
    if (w == null || h == null) return null;
    return mm(w) + ' × ' + mm(h) + ' cm · ' + toIn(w) + ' × ' + toIn(h) + ' in';
  }

  function capText(w) {
    var k = langNow();
    return k === 'kr' ? (w.title_kr || w.title_en) : (w.title_en || w.title_kr);
  }
  function altText(w) {
    var k = langNow();
    return k === 'kr' ? (w.title_en || w.title_kr) : (w.title_kr || w.title_en);
  }
  function medText(w) {
    var k = langNow();
    return k === 'kr' ? (w.medium_kr || w.medium_en) : (w.medium_en || w.medium_kr);
  }

  function matches(w, key) {
    if (key === 'all') return w.series !== 'album';
    if (key === 'sel') return !!w.sel;
    if (YEARKEY.test(key)) return w.series !== 'album' && String(w.year) === key;
    return w.series === key;
  }

  function visibleIndices() {
    var out = [];
    for (var i = 0; i < works.length; i++) {
      if (matches(works[i], activeFilter)) out.push(i);
    }
    return out;
  }

  /* ---------------- units ---------------- */
  function applyUnit(u) {
    unit = u;
    var uc = document.getElementById('unit-cm'), ui = document.getElementById('unit-in');
    if (uc) uc.setAttribute('aria-pressed', u === 'cm' ? 'true' : 'false');
    if (ui) ui.setAttribute('aria-pressed', u === 'in' ? 'true' : 'false');
    if (wlabel && wlabel.classList.contains('on')) showLabel(wlabel.dataset.i);
    if (lb && lb.classList.contains('open')) render(lbIndex);
  }
  var ucm = document.getElementById('unit-cm'), uin = document.getElementById('unit-in');
  if (ucm) ucm.addEventListener('click', function () { applyUnit('cm'); });
  if (uin) uin.addEventListener('click', function () { applyUnit('in'); });

  /* ---------------- mobile filter: one row, then a dark-room sheet ---------------- */
  var mTrig = document.getElementById('mfilter-trigger');
  var mSheet = document.getElementById('filter-sheet');
  var mVeil = document.getElementById('filter-veil');
  var mBody = document.getElementById('filter-sheet-body');
  var mValue = document.getElementById('mfilter-value');
  var mOpen = false;

  function sheetLabel(el, isKr) {
    var sp = el.querySelector('span');
    var t = sp ? (sp.getAttribute(isKr ? 'data-kr' : 'data-en') || sp.textContent) : el.textContent;
    return (t || '').trim();
  }

  if (mTrig && mSheet && mBody) {
    var blocks = [];
    if (stripEl) blocks.push({ el: stripEl, en: 'Chapter', kr: '연도' });
    if (seriesRow) blocks.push({ el: seriesRow, en: 'Series', kr: '연작' });
    blocks.forEach(function (b) {
      var isKr = langNow() === 'kr';
      var block = document.createElement('div');
      block.className = 'fs-block';
      var lab = document.createElement('p');
      lab.className = 'fs-label';
      lab.setAttribute('data-en', b.en);
      lab.setAttribute('data-kr', b.kr);
      lab.textContent = isKr ? b.kr : b.en;
      block.appendChild(lab);
      var clone = b.el.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('fs-filters');
      block.appendChild(clone);
      mBody.appendChild(block);
    });

    var openSheet = function () {
      mOpen = true;
      mSheet.classList.add('open');
      if (mVeil) mVeil.classList.add('open');
      mTrig.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    var closeSheet = function () {
      if (!mOpen) return;
      mOpen = false;
      mSheet.classList.remove('open');
      if (mVeil) mVeil.classList.remove('open');
      mTrig.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    mTrig.addEventListener('click', function () { if (mOpen) { closeSheet(); } else { openSheet(); } });
    if (mVeil) mVeil.addEventListener('click', closeSheet);
    var mClose = document.getElementById('filter-close');
    if (mClose) mClose.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mOpen) closeSheet(); });
    mBody.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-filter]') : null;
      if (b) applyFilter(b.dataset.filter);
    });
    document.addEventListener('langchange', function () {
      Array.prototype.forEach.call(mBody.querySelectorAll('[data-en][data-kr]'), function (el) {
        el.textContent = el.getAttribute(langNow() === 'kr' ? 'data-kr' : 'data-en') || el.textContent;
      });
    });
  }

  /* ---------------- filters · chapters · view ---------------- */
  function labelFor(key) {
    var el = document.querySelector('[data-filter="' + key + '"]');
    if (!el) return key;
    return sheetLabel(el, langNow() === 'kr');
  }

  function syncPressed() {
    var btns = document.querySelectorAll('[data-filter]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].dataset.filter === activeFilter ? 'true' : 'false');
    }
    if (mValue) mValue.textContent = labelFor(activeFilter);
  }

  var viewBtns = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  function syncView() {
    viewBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.view === activeView ? 'true' : 'false');
    });
  }

  function updateURL() {
    var q = [];
    if (activeFilter !== 'sel') q.push('f=' + activeFilter);
    if (activeView === 'index') q.push('v=index');
    var url = location.pathname + (q.length ? '?' + q.join('&') : '');
    if (history.replaceState) history.replaceState(null, '', url);
  }

  function scrolledToWorks() {
    var bar = document.querySelector('.works-bar');
    if (!bar) return;
    var y = bar.getBoundingClientRect().bottom + window.scrollY - 36;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function applyFilter(key, silent) {
    if (!document.querySelector('[data-filter="' + key + '"]')) key = 'sel';
    activeFilter = key;
    syncPressed();
    paint();
    if (mOpen && typeof closeSheet === 'function') closeSheet();
    if (!silent) { updateURL(); scrolledToWorks(); }
    document.dispatchEvent(new CustomEvent('filterchange', { detail: { key: key } }));
  }

  function setView(v, silent) {
    activeView = (v === 'index') ? 'index' : 'rows';
    syncView();
    paint();
    if (!silent) { updateURL(); scrolledToWorks(); }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-filter]') : null;
    if (!b || (mBody && mBody.contains(b))) return;
    applyFilter(b.dataset.filter);
  });
  viewBtns.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });

  /* ---------------- curated grid (Selected) ---------------- */
  function buildGrid() {
    var idxs = visibleIndices();
    var frag = document.createDocumentFragment();
    var k = langNow() === 'kr';
    idxs.forEach(function (i) {
      var w = works[i];
      var fig = document.createElement('figure');
      fig.className = 'work';
      fig.dataset.i = i;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'work-open';
      btn.setAttribute('aria-label', (k ? '작품 보기: ' : 'View ') + capText(w) + ', ' + w.year);
      var img = document.createElement('img');
      img.src = w.img;
      img.width = w.iw;
      img.height = w.ih;
      img.alt = capText(w) + ', ' + w.year;
      img.loading = 'lazy';
      img.decoding = 'async';
      btn.appendChild(img);
      btn.addEventListener('click', function () { open(i); });

      var cap = document.createElement('figcaption');
      cap.className = 'work-cap';
      var wt = document.createElement('span');
      wt.className = 'wt';
      wt.setAttribute('data-en', w.title_en);
      wt.setAttribute('data-kr', w.title_kr);
      wt.textContent = capText(w);
      cap.appendChild(wt);
      var med = medText(w);
      var size = sizeText(w.w, w.h, unit);
      if (med || size) {
        var wm = document.createElement('span');
        wm.className = 'wm';
        wm.textContent = [med, size].filter(Boolean).join(' · ');
        cap.appendChild(wm);
      }
      var wy = document.createElement('span');
      wy.className = 'wy';
      wy.textContent = w.year;
      cap.appendChild(wy);

      fig.appendChild(btn);
      fig.appendChild(cap);
      frag.appendChild(fig);
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  /* ---------------- justified wall ---------------- */
  var wallChapters = [];

  function aspectOf(i) {
    var w = works[i];
    return (w.iw && w.ih) ? w.iw / w.ih : 0.72;
  }
  function rowTarget() {
    var vw = window.innerWidth || document.documentElement.clientWidth;
    if (vw < 560) return 150;
    if (vw < 900) return 200;
    return 300;
  }

  function layoutRows(idxs, W) {
    var gap = 8;
    var target = rowTarget();
    var rows = [], row = [], sum = 0;
    for (var n = 0; n < idxs.length; n++) {
      var i = idxs[n];
      /* height this row would have if it closed before this work */
      var hPrev = row.length ? (W - gap * (row.length - 1)) / sum : Infinity;
      row.push(i);
      sum += aspectOf(i);
      var h = (W - gap * (row.length - 1)) / sum;
      if (h <= target) {
        /* keep the break whose row height sits closest to the target */
        if (row.length > 1 && hPrev <= target * 1.06 && Math.abs(hPrev - target) < Math.abs(h - target)) {
          var carry = row.pop();
          sum -= aspectOf(carry);
          rows.push({ items: row, h: hPrev });
          row = [carry];
          sum = aspectOf(carry);
        } else {
          rows.push({ items: row, h: h });
          row = [];
          sum = 0;
        }
      }
    }
    if (row.length) {
      var h2 = (W - gap * (row.length - 1)) / sum;
      rows.push({ items: row, h: Math.min(h2, target) });
    }
    return rows;
  }

  function buildRows(holder, idxs) {
    var W = Math.round(holder.clientWidth);
    if (!W) return;
    var rows = layoutRows(idxs, W);
    var frag = document.createDocumentFragment();
    var k = langNow() === 'kr';
    rows.forEach(function (r) {
      var rowEl = document.createElement('div');
      rowEl.className = 'wrow';
      rowEl.style.height = r.h.toFixed(2) + 'px';
      r.items.forEach(function (i) {
        var w = works[i];
        var fig = document.createElement('figure');
        fig.className = 'wimg';
        fig.style.width = (r.h * aspectOf(i)).toFixed(2) + 'px';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wopen';
        btn.dataset.i = i;
        btn.setAttribute('aria-label', (k ? '작품 보기: ' : 'View ') + capText(w) + ', ' + w.year);

        var img = document.createElement('img');
        img.src = w.img;
        img.width = w.iw;
        img.height = w.ih;
        img.alt = capText(w) + ', ' + w.year;
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        btn.addEventListener('click', function () { open(i); });

        fig.appendChild(btn);
        rowEl.appendChild(fig);
      });
      frag.appendChild(rowEl);
    });
    holder.appendChild(frag);
  }

  function renderWall() {
    wall.innerHTML = '';
    wallChapters = [];
    var idxs = visibleIndices();

    if (activeFilter === 'all') {
      var byYear = {};
      idxs.forEach(function (i) {
        var y = String(works[i].year);
        (byYear[y] = byYear[y] || []).push(i);
      });
      Object.keys(byYear).sort().reverse().forEach(function (y) {
        var sec = document.createElement('section');
        sec.className = 'wchapter';
        var h = document.createElement('h2');
        h.className = 'wchapter-h';
        h.innerHTML = '<span class="y">' + y + '</span><span class="c">' + byYear[y].length + '</span>';
        var holder = document.createElement('div');
        holder.className = 'wrows';
        sec.appendChild(h);
        sec.appendChild(holder);
        wall.appendChild(sec);
        wallChapters.push({ holder: holder, idxs: byYear[y], done: false });
      });
    } else {
      var only = document.createElement('div');
      only.className = 'wrows wrows--single';
      wall.appendChild(only);
      wallChapters.push({ holder: only, idxs: idxs, done: false });
    }
    pump();
  }

  /* build one chapter ahead as the reader scrolls; keeps the first paint light */
  function pump() {
    for (var n = 0; n < wallChapters.length; n++) {
      var c = wallChapters[n];
      if (c.done) continue;
      buildRows(c.holder, c.idxs);
      c.done = true;
      var last = c.holder.lastElementChild || c.holder;
      var r = last.getBoundingClientRect();
      if (r.bottom > (window.innerHeight || 800) + 1200) return;
    }
  }
  window.addEventListener('scroll', function () { if (wallChapters.length) pump(); }, { passive: true });

  /* ---------------- wall label (hover / focus) ---------------- */
  function showLabel(i) {
    if (!wlabel) return;
    var w = works[i];
    if (!w) return;
    wlabel.dataset.i = i;
    var med = medText(w);
    var size = sizeText(w.w, w.h, unit);
    var meta = [med, size, w.year].filter(Boolean).join(' · ');
    wlabel.innerHTML = '<span class="wl-t"></span><span class="wl-m"></span>';
    wlabel.querySelector('.wl-t').textContent = capText(w);
    wlabel.querySelector('.wl-m').textContent = meta;
    wlabel.classList.add('on');
  }
  function hideLabel() {
    if (wlabel) wlabel.classList.remove('on');
  }
  if (wall) {
    wall.addEventListener('pointerover', function (e) {
      var b = e.target.closest ? e.target.closest('.wopen') : null;
      if (b) showLabel(+b.dataset.i);
    });
    wall.addEventListener('pointerout', function (e) {
      var b = e.target.closest ? e.target.closest('.wopen') : null;
      if (!b) return;
      if (e.relatedTarget && b.contains(e.relatedTarget)) return;
      hideLabel();
    });
    wall.addEventListener('focusin', function (e) {
      var b = e.target.closest ? e.target.closest('.wopen') : null;
      if (b) showLabel(+b.dataset.i);
    });
    wall.addEventListener('focusout', hideLabel);
  }

  /* ---------------- text index ---------------- */
  function renderIndex() {
    var idxs = visibleIndices();
    var byYear = {};
    idxs.forEach(function (i) {
      var y = String(works[i].year);
      (byYear[y] = byYear[y] || []).push(i);
    });
    var years = Object.keys(byYear).sort().reverse();
    var k = langNow() === 'kr';
    var frag = document.createDocumentFragment();

    years.forEach(function (y) {
      var sec = document.createElement('section');
      sec.className = 'ichapter';
      var h = document.createElement('h2');
      h.className = 'ichapter-h';
      h.innerHTML = '<span class="y">' + y + '</span><span class="c">' + byYear[y].length + '</span>';
      sec.appendChild(h);

      var ul = document.createElement('ul');
      ul.className = 'ilist';
      byYear[y].forEach(function (i) {
        var w = works[i];
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.className = 'iitem';
        a.dataset.i = i;
        a.href = w.page ? w.page : '#' + w.id;
        a.setAttribute('data-en', w.title_en);
        a.setAttribute('data-kr', w.title_kr);
        a.textContent = capText(w);
        a.addEventListener('click', function (e) {
          if (w.page) return;
          e.preventDefault();
          open(i);
        });
        li.appendChild(a);
        var ys = document.createElement('span');
        ys.className = 'iy';
        ys.textContent = w.year;
        li.appendChild(ys);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      frag.appendChild(sec);
    });

    indexBox.innerHTML = '';
    indexBox.appendChild(frag);
  }

  /* ---------------- render ---------------- */
  function updateTally(n) {
    var el = document.getElementById('works-tally');
    if (!el) return;
    var k = langNow() === 'kr';
    var num = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var label = activeFilter === 'all' ? '2020–2026' : labelFor(activeFilter);
    el.textContent = activeFilter === 'sel'
      ? (k ? '선별 ' + num + '점' : num + ' selected works')
      : (k ? num + '점 · ' + label : num + ' works · ' + label);
  }

  function paint() {
    var isShort = activeFilter === 'short';
    var mode = activeView === 'index' ? 'index' : (isShort ? 'short' : (activeFilter === 'sel' ? 'grid' : 'wall'));
    grid.hidden = mode !== 'grid';
    wall.hidden = mode !== 'wall';
    indexBox.hidden = mode !== 'index';
    if (shortWrap) shortWrap.hidden = mode !== 'short';
    if (albumCredits) albumCredits.hidden = !(activeFilter === 'album' && mode !== 'index');
    hideLabel();

    if (mode === 'grid') buildGrid();
    else if (mode === 'wall') renderWall();
    else if (mode === 'index') renderIndex();
    else if (mode === 'short') { buildShortGroups(); refreshShort(); }
    updateTally(visibleIndices().length);
  }

  var resizeTick = 0;
  window.addEventListener('resize', function () {
    if (resizeTick) window.clearTimeout(resizeTick);
    resizeTick = window.setTimeout(function () {
      resizeTick = 0;
      if (activeView !== 'index' && activeFilter !== 'sel' && activeFilter !== 'short') renderWall();
    }, 180);
  });

  /* ---------------- short series: one section, divided by sub-headings ------------- */
  var shortBuilt = false;
  var shortFigs = [];

  function buildShortGroups() {
    if (!shortWrap || shortBuilt) return;
    shortBuilt = true;
    var k = langNow();
    Array.prototype.forEach.call(shortWrap.querySelectorAll('.sgrp'), function (sec) {
      var g = sec.dataset.grp;
      var holder = sec.querySelector('.sgrp-grid');
      if (!holder) return;
      for (var i = 0; i < works.length; i++) {
        var w = works[i];
        if (w.series !== 'short' || w.grp !== g) continue;
        var fig = document.createElement('figure');
        fig.className = 'work';
        fig.dataset.i = i;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'work-open';
        btn.setAttribute('aria-label', (k === 'kr' ? '작품 보기: ' : 'View ') + capText(w));

        var img = document.createElement('img');
        img.src = w.img;
        img.width = w.iw;
        img.height = w.ih;
        img.alt = capText(w) + ', ' + w.year;
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        btn.addEventListener('click', (function (n) { return function () { open(n); if (works[n].page) window.location.href = works[n].page; }; })(i));

        var cap = document.createElement('figcaption');
        cap.className = 'work-cap';
        var wt = document.createElement('span');
        wt.className = 'wt';
        wt.textContent = capText(w);
        cap.appendChild(wt);
        var med = medText(w);
        if (med) {
          var wm = document.createElement('span');
          wm.className = 'wm';
          wm.textContent = med;
          cap.appendChild(wm);
        }
        var wy = document.createElement('span');
        wy.className = 'wy';
        wy.textContent = w.year;
        cap.appendChild(wy);

        fig.appendChild(btn);
        fig.appendChild(cap);
        holder.appendChild(fig);
        shortFigs.push(fig);
      }
    });
  }

  function refreshShort() {
    if (!shortFigs.length) return;
    var k = langNow();
    shortFigs.forEach(function (fig) {
      var w = works[parseInt(fig.dataset.i, 10)];
      var t = capText(w);
      var wt = fig.querySelector('.wt');
      if (wt) wt.textContent = t;
      var wm = fig.querySelector('.wm');
      if (wm) wm.textContent = medText(w);
      var img = fig.querySelector('img');
      if (img) img.alt = t + ', ' + w.year;
      var btn = fig.querySelector('.work-open');
      if (btn) btn.setAttribute('aria-label', (k === 'kr' ? '작품 보기: ' : 'View ') + t);
    });
  }

  document.addEventListener('langchange', function () {
    hideLabel();
    if (wlabel && wlabel.dataset.i) hideLabel();
    if (activeView === 'index') renderIndex();
    else if (activeFilter === 'sel') buildGrid();
    else if (activeFilter === 'short') refreshShort();
    else { syncPressed(); }
    if (mValue) mValue.textContent = labelFor(activeFilter);
    updateTally(visibleIndices().length);
  });

  /* ---------------- lightbox ---------------- */
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbTitle = document.getElementById('lb-title');
  var lbAlt = document.getElementById('lb-alt');
  var lbLine2 = document.getElementById('lb-line2');
  var lbLine3 = document.getElementById('lb-line3');
  var lbInquire = document.getElementById('lb-inquire');
  var lbPress = document.getElementById('lb-press');
  var lbMore = document.getElementById('lb-more');
  var lbIndex = -1;
  var lastFocus = null;

  var SERIES_LABEL = {
    cc: { en: 'Delegated Consciousness', kr: '위임된 의식' },
    frame: { en: 'Frame – We Are Always Confined', kr: 'Frame – 우리는 늘 갇혀 있다' },
    tp: { en: 'Tremors of Countless Particles', kr: '무수한 입자의 떨림' },
    sil: { en: 'Silhouette', kr: '실루엣' },
    bird: { en: 'Like a Bird with a Broken Leg', kr: '다리가 부러진 새처럼' },
    frag: { en: 'Fragments', kr: '편린' },
    short: { en: 'Short series', kr: '소연작 모음' },
    album: { en: 'Album artwork', kr: '앨범 아트워크' }
  };
  var GRP_LABEL = {
    fieldvoid: { en: 'Field and Void', kr: '장과 공' },
    pigment: { en: 'Pigment of Light', kr: '빛의 안료' },
    timeline: { en: 'Timeline I · II', kr: '시간선 I · II' },
    support: { en: 'Support I · II', kr: '버팀목 I · II' },
    past: { en: 'Person Living in the Past', kr: '과거에 사는 사람' },
    cardboard: { en: 'Cardboard works', kr: '골판지 작업' }
  };

  function seriesLabel(w) {
    var k = langNow();
    var sl = SERIES_LABEL[w.series];
    if (!sl && /^y\d{4}$/.test(w.series)) sl = { en: w.series.slice(1), kr: w.series.slice(1) };
    if (!sl) sl = { en: '', kr: '' };
    var name = k === 'kr' ? sl.kr : sl.en;
    if (w.series === 'short' && w.grp && GRP_LABEL[w.grp]) {
      var g = GRP_LABEL[w.grp];
      return name + ' · ' + (k === 'kr' ? g.kr : g.en);
    }
    return name;
  }

  function render(i) {
    var w = works[i];
    lbIndex = i;
    var k = langNow();
    lbImg.src = w.img;
    lbImg.alt = w.title_en + ', ' + w.year;
    lbTitle.textContent = k === 'kr' ? w.title_kr : w.title_en;
    var other = k === 'kr' ? w.title_en : w.title_kr;
    var sub = k === 'kr' ? w.sub_kr : w.sub_en;
    lbAlt.textContent = [sub, other !== lbTitle.textContent ? other : ''].filter(Boolean).join(' · ');
    /* wall label, three lines: title · medium and size · year and series */
    var st = sizeText(w.w, w.h, unit);
    var med = w.series === 'album' ? (k === 'kr' ? '앨범 커버 아트워크' : 'Album cover artwork') : medText(w);
    var line2 = [med, st].filter(Boolean).join(' · ');
    if (!line2) line2 = (k === 'kr' ? '재료와 크기 문의' : 'Medium and dimensions on request');
    if (lbLine2) lbLine2.textContent = line2;
    if (lbLine3) lbLine3.textContent = [w.year, seriesLabel(w)].filter(Boolean).join(' · ');
    var title = k === 'kr' ? w.title_kr : w.title_en;
    var subj = (k === 'kr' ? '[작품 문의] ' : 'Inquiry: ') + title + ' (' + w.year + (st ? ', ' + st : '') + ')';
    var body = (k === 'kr'
      ? '안녕하세요. ' + title + ' (' + w.year + (st ? ', ' + st : '') + ') 작품을 문의드립니다.\n\n'
      : 'I am writing about ' + title + ' (' + [w.year, w.medium_en, st].filter(Boolean).join(', ') + ').\n\n');
    lbInquire.href = 'mailto:e.zy@kakao.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body + (k === 'kr' ? '성함:\n소속:\n\n감사합니다.' : 'Name:\nAffiliation:\n\nThank you.'));
    lbPress.href = w.img;
    lbPress.setAttribute('download', 'E.ZY_' + w.id + '.jpg');
    if (lbMore) {
      if (w.page) {
        lbMore.href = w.page;
        lbMore.hidden = false;
        lbMore.querySelector('span').textContent = k === 'kr' ? '작품 페이지' : 'Work page';
      } else {
        lbMore.hidden = true;
      }
    }
  }

  function preload(i) {
    var w = works[i];
    if (!w) return;
    var im = new Image();
    im.src = w.img;
  }

  function open(i) {
    lastFocus = document.activeElement;
    render(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.setAttribute('tabindex', '-1');
    lb.focus({ preventScroll: true });
    var vis = visibleIndices();
    var p = vis.indexOf(i);
    if (p !== -1 && vis.length > 1) {
      preload(vis[(p + 1) % vis.length]);
      preload(vis[(p - 1 + vis.length) % vis.length]);
    }
    if (history.replaceState) history.replaceState(null, '', (location.pathname + location.search) + '#' + works[i].id);
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
    preload(vis[(vis.indexOf(nextIdx) + d + vis.length) % vis.length]);
    if (history.replaceState) history.replaceState(null, '', (location.pathname + location.search) + '#' + works[nextIdx].id);
  }

  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });

  var tx = 0, ty = 0;
  var lbStage = lb.querySelector('.lb-stage');
  if (lbStage) {
    lbStage.addEventListener('touchstart', function (e) {
      tx = e.changedTouches[0].clientX;
      ty = e.changedTouches[0].clientY;
    }, { passive: true });
    lbStage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { step(-1); return; }
    if (e.key === 'ArrowRight') { step(1); return; }
    if (e.key === 'Tab') {
      var f = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === lb)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  document.addEventListener('langchange', function () {
    if (lb.classList.contains('open')) render(lbIndex);
  });

  /* ---------------- initial state ---------------- */
  var mf = /[?&]f=([a-z0-9]+)/.exec(location.search);
  var mv = /[?&]v=([a-z]+)/.exec(location.search);
  if (mv && mv[1] === 'index') activeView = 'index';
  applyFilter(mf ? mf[1] : 'sel', true);
  syncView();

  function groupFromHash() {
    var h = (location.hash || '').slice(1);
    if (!h || h.indexOf('g-') !== 0 || !shortWrap) return false;
    var target = document.getElementById(h);
    if (!target) return false;
    if (activeFilter !== 'short') applyFilter('short', true);
    buildShortGroups();
    target.scrollIntoView({ block: 'start' });
    return true;
  }

  function openFromHash() {
    var id = (location.hash || '').slice(1);
    if (!id || id.indexOf('g-') === 0) return false;
    for (var i = 0; i < works.length; i++) {
      if (works[i].id === id) {
        if (visibleIndices().indexOf(i) === -1) applyFilter(String(works[i].year), true);
        open(i);
        return true;
      }
    }
    return false;
  }

  window.addEventListener('hashchange', function () {
    if (groupFromHash()) return;
    if (lb.classList.contains('open')) return;
    openFromHash();
  });

  if (location.hash && !groupFromHash()) {
    if (!lb.classList.contains('open')) openFromHash();
  }
})();
