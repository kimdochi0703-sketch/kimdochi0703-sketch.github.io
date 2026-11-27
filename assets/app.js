/* E.ZY — site behaviour
   language · header · menu · reveal · works filter · units · lightbox */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');
  var page = (location.pathname.split('/').pop() || 'index.html');

  /* ---------------- language ---------------- */
  var STORE = 'ezy-lang';
  var titles = {
    'index.html':   { en: 'E.ZY — Lee Ji Hwan', kr: 'E.ZY 이지환' },
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
  function langNow() { return docEl.getAttribute('data-lang') === 'kr' ? 'kr' : 'en'; }

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
  function setMenuLabel(open) {
    var span = menuBtn.querySelector('span');
    if (!span) return;
    span.setAttribute('data-en', open ? 'Close' : 'Menu');
    span.setAttribute('data-kr', open ? '닫기' : '메뉴');
    span.textContent = span.getAttribute(langNow() === 'kr' ? 'data-kr' : 'data-en');
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
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
    document.addEventListener('langchange', function () { setMenuLabel(menu && menu.classList.contains('open')); });
  }

  /* ---------------- reveal ---------------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function revealInView() {
    if (!rvs.length) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    rvs = rvs.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.98 && r.bottom > -vh * 0.15) { el.classList.add('in'); return false; }
      return true;
    });
    if (!rvs.length) window.removeEventListener('scroll', onScrollReveal);
  }
  function onScrollReveal() {
    if (revealRaf) return;
    revealRaf = requestAnimationFrame(function () { revealRaf = 0; revealInView(); });
  }
  var revealRaf = 0;
  if (reduce) {
    rvs.forEach(function (el) { el.classList.add('in'); });
    rvs = [];
  } else {
    revealInView();
    window.addEventListener('scroll', onScrollReveal, { passive: true });
    window.addEventListener('resize', onScrollReveal, { passive: true });
    window.addEventListener('load', revealInView);
  }

  /* ---------------- works page ---------------- */
  var grid = document.getElementById('works-grid');
  if (!grid || !window.WORKS) return;

  var works = window.WORKS;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.work-card'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var unit = 'cm';

  var FILTERS = {
    sel: {
      label_en: 'Selection', label_kr: '선별',
      title_en: 'Selected works, 2023 — 2026', title_kr: '선별 작품, 2023 — 2026',
      desc_en: 'The portfolio selection: seven works from Consigned Consciousness, seven from Tremors of Countless Particles, and Frame. These are the works sent to galleries and fairs.',
      desc_kr: '포트폴리오에 실은 15점. 〈위임된 의식〉 7점, 〈무수한 입자의 떨림〉 7점, 〈Frame〉 1점입니다. 갤러리와 아트페어에 보내는 작품입니다.'
    },
    all: {
      label_en: 'All works', label_kr: '전체 작품',
      title_en: 'Everything catalogued', title_kr: '수록된 모든 작업',
      desc_en: 'The whole record, series first: Consigned Consciousness, Frame, the individual works of 2026, and the particle paintings of 2023–24.',
      desc_kr: '기록한 전부. 〈위임된 의식〉과 〈Frame〉, 2026년의 개별 작업, 2023–24년의 입자 연작이 차례로 이어집니다.'
    },
    cc: {
      label_en: 'Series I', label_kr: '연작 I',
      title_en: 'Consigned Consciousness', title_kr: '〈위임된 의식〉',
      desc_en: 'A circle is the vessel of thought; a rectangle is the screen that absorbs it. Twenty-one of the twenty-three paintings are reproduced; the first two are held with the studio.',
      desc_kr: '원은 사유의 그릇, 사각형은 그것을 받아 가는 화면. 23점 가운데 21점을 실었고, 첫 두 점은 작업실에 있습니다.'
    },
    frame: {
      label_en: 'Series III', label_kr: '연작 III',
      title_en: 'Frame — We Are Always Confined', title_kr: 'Frame — 우리는 늘 갇혀 있다',
      desc_en: 'A structural work in which the frame is never seen; it is read only through the contours it leaves on the surface. One plane divided into rectangles of different sizes becomes a set of universes we cannot step outside.',
      desc_kr: '틀을 보이지 않게 다룬 구조 작업. 표면에 남은 윤곽으로만 틀의 존재를 읽습니다. 한 화면을 나눈 여러 크기의 사각형은 각각 하나의 우주이고, 우리는 그 밖으로 나가지 못합니다.'
    },
    archive: {
      label_en: '2026', label_kr: '2026',
      title_en: 'Studio Archive, 2026', title_kr: '스튜디오 아카이브, 2026',
      desc_en: 'Individual works made beside the series, each with its own title and date. For the most recent, medium and dimensions are still being confirmed with the studio.',
      desc_kr: '연작 옆에서 그린 개별 작업. 각각의 제목과 날짜를 가집니다. 가장 최근작의 재료와 크기는 확인 중입니다.'
    },
    tp: {
      label_en: 'Series II', label_kr: '연작 II',
      title_en: 'Tremors of Countless Particles, 2023 — 2024', title_kr: '무수한 입자의 떨림, 2023 — 2024',
      desc_en: 'Oil pastel smeared and layered until form loosens into particles: the question of why anything exists in this shape, now.',
      desc_kr: '형태가 입자로 풀어질 때까지 오일파스텔을 문지르고 쌓았습니다. 무엇이 왜 지금 이 모습으로 존재하는가에 대한 질문입니다.'
    }
  };

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
    if (lb.classList.contains('open')) render(lbIndex);
  }
  var ucm = document.getElementById('unit-cm'), uin = document.getElementById('unit-in');
  if (ucm) ucm.addEventListener('click', function () { applyUnit('cm'); });
  if (uin) uin.addEventListener('click', function () { applyUnit('in'); });

  /* filters */
  var activeFilter = 'sel';
  var leadLabel = document.getElementById('fl-label');
  var leadTitle = document.getElementById('fl-title');
  var leadDesc = document.getElementById('fl-desc');

  function visibleIndices() {
    var out = [];
    for (var i = 0; i < works.length; i++) {
      if (activeFilter === 'all' || (activeFilter === 'sel' ? works[i].sel : works[i].series === activeFilter)) out.push(i);
    }
    return out;
  }

  function paintLead() {
    var f = FILTERS[activeFilter] || FILTERS.sel;
    var k = langNow();
    if (leadLabel) {
      leadLabel.setAttribute('data-en', f.label_en);
      leadLabel.setAttribute('data-kr', f.label_kr);
      leadLabel.textContent = k === 'kr' ? f.label_kr : f.label_en;
    }
    if (leadTitle) {
      leadTitle.setAttribute('data-en', f.title_en);
      leadTitle.setAttribute('data-kr', f.title_kr);
      leadTitle.textContent = k === 'kr' ? f.title_kr : f.title_en;
    }
    if (leadDesc) {
      leadDesc.setAttribute('data-en', f.desc_en);
      leadDesc.setAttribute('data-kr', f.desc_kr);
      leadDesc.textContent = k === 'kr' ? f.desc_kr : f.desc_en;
    }
  }

  function applyFilter(key, silent) {
    if (!FILTERS[key]) key = 'sel';
    activeFilter = key;
    var visible = 0;
    cards.forEach(function (c) {
      var w = works[parseInt(c.dataset.index, 10)];
      var on = (key === 'all') || (key === 'sel' ? w.sel : w.series === key);
      c.classList.toggle('is-hidden', !on);
      if (on) { c.classList.add('in'); visible++; }
    });
    filters.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.filter === key ? 'true' : 'false');
    });
    paintLead();
    if (!silent) {
      var url = location.pathname + (key === 'sel' ? '' : '?f=' + key);
      if (history.replaceState) history.replaceState(null, '', url);
    }
    document.dispatchEvent(new CustomEvent('filterchange', { detail: { key: key, count: visible } }));
  }

  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      applyFilter(b.dataset.filter);
      var y = grid.getBoundingClientRect().top + window.scrollY - 130;
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ---------------- lightbox ---------------- */
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbTitle = document.getElementById('lb-title');
  var lbAlt = document.getElementById('lb-alt');
  var lbCount = document.getElementById('lb-count');
  var lbSeries = document.getElementById('lb-series');
  var lbMedium = document.getElementById('lb-medium');
  var lbMediumRow = document.getElementById('lb-medium-row');
  var lbSize = document.getElementById('lb-size');
  var lbYear = document.getElementById('lb-year');
  var lbNote = document.getElementById('lb-note');
  var lbInquire = document.getElementById('lb-inquire');
  var lbPress = document.getElementById('lb-press');
  var lbIndex = -1;
  var lastFocus = null;

  var SERIES_LABEL = {
    cc: { en: 'Consigned Consciousness · Series I', kr: '위임된 의식 · 연작 I' },
    frame: { en: 'Frame · Series III', kr: 'Frame · 연작 III' },
    archive: { en: 'Studio Archive · 2026', kr: '스튜디오 아카이브 · 2026' },
    tp: { en: 'Tremors of Countless Particles · Series II', kr: '무수한 입자의 떨림 · 연작 II' }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function render(i) {
    var w = works[i];
    lbIndex = i;
    var k = langNow();
    lbImg.src = w.img;
    lbImg.alt = w.title_en + ', ' + w.year;
    lbTitle.textContent = k === 'kr' ? w.title_kr : w.title_en;
    var other = k === 'kr' ? w.title_en : w.title_kr;
    var sub = k === 'kr' ? w.sub_kr : w.sub_en;
    lbAlt.textContent = [sub, other].filter(Boolean).join(' · ');
    var vis = visibleIndices();
    var pos = vis.indexOf(i);
    lbCount.textContent = pad(pos + 1) + ' / ' + pad(vis.length);
    var sl = SERIES_LABEL[w.series] || { en: '', kr: '' };
    lbSeries.textContent = k === 'kr' ? sl.kr : sl.en;
    if (w.medium_en) {
      lbMediumRow.style.display = '';
      lbMedium.textContent = k === 'kr' ? w.medium_kr : w.medium_en;
    } else {
      lbMediumRow.style.display = 'none';
    }
    var st = sizeText(w.w, w.h, unit);
    lbSize.textContent = st || (k === 'kr' ? '크기 문의' : 'Dimensions on request');
    lbYear.textContent = w.year;
    lbNote.textContent = k === 'kr' ? w.note_kr : w.note_en;
    var title = k === 'kr' ? w.title_kr : w.title_en;
    var subj = (k === 'kr' ? '[작품 문의] ' : 'Inquiry: ') + title + ' (' + w.year + (st ? ', ' + st : '') + ')';
    var body = (k === 'kr'
      ? '안녕하세요. ' + title + ' (' + w.year + (st ? ', ' + st : '') + ') 작품을 문의드립니다.\n\n'
      : 'I am writing about ' + title + ' (' + [w.year, w.medium_en, st].filter(Boolean).join(', ') + ').\n\n');
    lbInquire.href = 'mailto:e.zy@kakao.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body + (k === 'kr' ? '성함:\n소속:\n\n감사합니다.' : 'Name:\nAffiliation:\n\nThank you.'));
    lbPress.href = w.img;
    lbPress.setAttribute('download', 'E.ZY_' + w.id + '.jpg');
    var fluid = lbCount.textContent;
    var status = document.getElementById('lb-count');
    if (status) status.setAttribute('aria-label', fluid);
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
    preload(vis[(p + 1) % vis.length]);
    preload(vis[(p - 1 + vis.length) % vis.length]);
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
    var btn = card.querySelector('.ph');
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
    paintLead();
    setMenuLabel(menu && menu.classList.contains('open'));
  });

  /* ---------------- initial state ---------------- */
  var m = /[?&]f=([a-z]+)/.exec(location.search);
  applyFilter(m && FILTERS[m[1]] ? m[1] : 'sel', true);

  window.addEventListener('hashchange', function () {
    var id = (location.hash || '').slice(1);
    if (!id) return;
    for (var i = 0; i < works.length; i++) {
      if (works[i].id === id && !lb.classList.contains('open')) {
        if (visibleIndices().indexOf(i) === -1) applyFilter(works[i].series, true);
        open(i);
        return;
      }
    }
  });

  if (location.hash) {
    var id = location.hash.slice(1);
    for (var k = 0; k < works.length; k++) {
      if (works[k].id === id) {
        var inFilter = visibleIndices().indexOf(k) !== -1;
        if (!inFilter) applyFilter(works[k].series, true);
        open(k);
        break;
      }
    }
  }
})();
