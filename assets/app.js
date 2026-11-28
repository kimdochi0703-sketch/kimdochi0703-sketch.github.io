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
    var t = titles[page];
    if (t) {
      document.title = isKr ? t.kr : t.en;
      var og = document.querySelector('meta[property="og:title"]');
      if (og) og.setAttribute('content', isKr ? t.kr : t.en);
    }
    var be = document.getElementById('lang-en'), bk = document.getElementById('lang-kr');
    if (be) be.setAttribute('aria-pressed', isKr ? 'false' : 'true');
    if (bk) bk.setAttribute('aria-pressed', isKr ? 'true' : 'false');
    if (save) { try { localStorage.setItem(STORE, lang); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  setLang(readLang(), false);
  var be = document.getElementById('lang-en'), bk = document.getElementById('lang-kr');
  if (be) be.addEventListener('click', function () { setLang('en', true); });
  if (bk) bk.addEventListener('click', function () { setLang('kr', true); });

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

  /* ---------------- works page ---------------- */
  var grid = document.getElementById('works-grid');
  if (!grid || !window.WORKS) return;

  var works = window.WORKS;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.work'));

  /* ---------------- mobile filter: one row, then a dark-room sheet ---------------- */
  var mTrig = document.getElementById('mfilter-trigger');
  var mSheet = document.getElementById('filter-sheet');
  var mVeil = document.getElementById('filter-veil');
  var mBody = document.getElementById('filter-sheet-body');
  var mValue = document.getElementById('mfilter-value');
  var mOpen = false;

  if (mTrig && mSheet && mBody) {
    Array.prototype.forEach.call(document.querySelectorAll('.filter-stack .filters'), function (g) {
      var isYear = g.classList.contains('filters--years');
      var block = document.createElement('div');
      block.className = 'fs-block';
      var lab = document.createElement('p');
      lab.className = 'fs-label';
      lab.setAttribute('data-en', isYear ? 'Year' : 'Series');
      lab.setAttribute('data-kr', isYear ? '연도' : '연작');
      lab.textContent = isYear
        ? (langNow() === 'kr' ? '연도' : 'Year')
        : (langNow() === 'kr' ? '연작' : 'Series');
      block.appendChild(lab);
      block.appendChild(g.cloneNode(true));
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
  }

  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var unit = 'cm';

  function syncMFilter(key) {
    if (!mValue) return;
    var stack = document.getElementById('filter-stack');
    if (!stack) return;
    var bs = stack.querySelectorAll('[data-filter]');
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].dataset.filter !== key) continue;
      var sp = bs[i].querySelector('span');
      var k = langNow() === 'kr';
      mValue.textContent = sp
        ? (sp.getAttribute(k ? 'data-kr' : 'data-en') || sp.textContent)
        : bs[i].textContent.trim();
      return;
    }
  }

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

  function applyUnit(u) {
    unit = u;
    var sizes = document.querySelectorAll('[data-size]');
    for (var i = 0; i < sizes.length; i++) {
      var t = sizeText(parseFloat(sizes[i].dataset.w), parseFloat(sizes[i].dataset.h), u);
      if (t) sizes[i].textContent = t;
    }
    var uc = document.getElementById('unit-cm'), ui = document.getElementById('unit-in');
    if (uc) uc.setAttribute('aria-pressed', u === 'cm' ? 'true' : 'false');
    if (ui) ui.setAttribute('aria-pressed', u === 'in' ? 'true' : 'false');
    if (lb && lb.classList.contains('open')) render(lbIndex);
  }
  var ucm = document.getElementById('unit-cm'), uin = document.getElementById('unit-in');
  if (ucm) ucm.addEventListener('click', function () { applyUnit('cm'); });
  if (uin) uin.addEventListener('click', function () { applyUnit('in'); });

  var activeFilter = 'sel';
  var YEARKEY = /^\d{4}$/;
  var shortWrap = document.getElementById('short-groups');
  var albumCredits = document.getElementById('album-credits');

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

  function applyFilter(key, silent) {
    var valid = false;
    for (var f = 0; f < filters.length; f++) {
      if (filters[f].dataset.filter === key) { valid = true; break; }
    }
    if (!valid) key = 'sel';
    activeFilter = key;
    var isShort = key === 'short';
    cards.forEach(function (c) {
      var w = works[parseInt(c.dataset.index, 10)];
      var on = !isShort && matches(w, key);
      c.classList.toggle('is-hidden', !on);
      if (on) c.classList.add('in');
    });
    if (grid) grid.hidden = isShort;
    if (shortWrap) {
      shortWrap.hidden = !isShort;
      if (isShort) buildShortGroups();
    }
    if (albumCredits) albumCredits.hidden = key !== 'album';
    filters.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.filter === key ? 'true' : 'false');
    });
    syncMFilter(key);
    if (mOpen) closeSheet();
    if (!silent) {
      var url = location.pathname + (key === 'sel' ? '' : '?f=' + key);
      if (history.replaceState) history.replaceState(null, '', url);
    }
    document.dispatchEvent(new CustomEvent('filterchange', { detail: { key: key } }));
  }

  /* ---------------- short series: one section, divided by sub-headings ------------- */
  var shortBuilt = false;
  var shortFigs = [];

  function capText(w) {
    return langNow() === 'kr' ? w.title_kr : w.title_en;
  }
  function medText(w) {
    var k = langNow();
    return k === 'kr' ? (w.medium_kr || w.medium_en) : (w.medium_en || w.medium_kr);
  }

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
        img.alt = capText(w) + ', ' + w.year;
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        btn.addEventListener('click', (function (n) { return function () { open(n); }; })(i));

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

  document.addEventListener('langchange', function () {
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
  });

  document.addEventListener('langchange', function () { syncMFilter(activeFilter); });

  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      applyFilter(b.dataset.filter);
      var y = grid.getBoundingClientRect().top + window.scrollY - 120;
      var bar = document.querySelector('.works-bar');
      if (bar) y = bar.getBoundingClientRect().bottom + window.scrollY - 40;
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ---------------- lightbox ---------------- */
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbTitle = document.getElementById('lb-title');
  var lbAlt = document.getElementById('lb-alt');
  var lbSeries = document.getElementById('lb-series');
  var lbMedium = document.getElementById('lb-medium');
  var lbMediumRow = document.getElementById('lb-medium-row');
  var lbSize = document.getElementById('lb-size');
  var lbSizeRow = lbSize ? lbSize.parentNode : null;
  var lbYear = document.getElementById('lb-year');
  var lbInquire = document.getElementById('lb-inquire');
  var lbPress = document.getElementById('lb-press');
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
    lbSeries.textContent = seriesLabel(w);
    if (w.medium_en || w.medium_kr) {
      lbMediumRow.style.display = '';
      lbMedium.textContent = k === 'kr' ? (w.medium_kr || w.medium_en) : (w.medium_en || w.medium_kr);
    } else {
      lbMediumRow.style.display = 'none';
    }
    var st = sizeText(w.w, w.h, unit);
    if (lbSizeRow) lbSizeRow.style.display = w.series === 'album' ? 'none' : '';
    lbSize.textContent = st || (k === 'kr' ? '크기 문의' : 'Dimensions on request');
    lbYear.textContent = w.year;
    var title = k === 'kr' ? w.title_kr : w.title_en;
    var subj = (k === 'kr' ? '[작품 문의] ' : 'Inquiry: ') + title + ' (' + w.year + (st ? ', ' + st : '') + ')';
    var body = (k === 'kr'
      ? '안녕하세요. ' + title + ' (' + w.year + (st ? ', ' + st : '') + ') 작품을 문의드립니다.\n\n'
      : 'I am writing about ' + title + ' (' + [w.year, w.medium_en, st].filter(Boolean).join(', ') + ').\n\n');
    lbInquire.href = 'mailto:e.zy@kakao.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body + (k === 'kr' ? '성함:\n소속:\n\n감사합니다.' : 'Name:\nAffiliation:\n\nThank you.'));
    lbPress.href = w.img;
    lbPress.setAttribute('download', 'E.ZY_' + w.id + '.jpg');
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

  cards.forEach(function (card) {
    var btn = card.querySelector('.work-open');
    var idx = parseInt(card.dataset.index, 10);
    if (!btn) return;
    btn.addEventListener('click', function () { open(idx); });
  });

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
  var m = /[?&]f=([a-z0-9]+)/.exec(location.search);
  applyFilter(m ? m[1] : 'sel', true);

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

  window.addEventListener('hashchange', function () {
    if (groupFromHash()) return;
    var id = (location.hash || '').slice(1);
    if (!id) return;
    for (var i = 0; i < works.length; i++) {
      if (works[i].id === id && !lb.classList.contains('open')) {
        if (visibleIndices().indexOf(i) === -1) applyFilter(String(works[i].year), true);
        open(i);
        return;
      }
    }
  });

  if (location.hash && !groupFromHash()) {
    var id0 = location.hash.slice(1);
    for (var kk = 0; kk < works.length; kk++) {
      if (works[kk].id === id0) {
        if (visibleIndices().indexOf(kk) === -1) applyFilter(String(works[kk].year), true);
        open(kk);
        break;
      }
    }
  }
})();
