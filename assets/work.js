/* E.ZY — work page: inspect the work at 2×
   click / tap = 2× and back · drag = move · double click = reset
   wheel is deliberately not used (it fights the scroll) · pinch on touch */
(function () {
  'use strict';

  var stage = document.getElementById('wstage');
  if (!stage) return;
  var img = document.getElementById('wimg');
  if (!img) return;

  var MAX = 2;
  var scale = 1, tx = 0, ty = 0;
  var dragging = false, moved = false;
  var startX = 0, startY = 0, baseX = 0, baseY = 0;

  function clampT() {
    var w = img.clientWidth || img.naturalWidth;
    var h = img.clientHeight || img.naturalHeight;
    var maxX = Math.max(0, (w * scale - stage.clientWidth) / 2);
    var maxY = Math.max(0, (h * scale - stage.clientHeight) / 2);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }

  function apply() {
    img.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
    stage.classList.toggle('is-zoomed', scale > 1.001);
  }

  function reset() {
    scale = 1; tx = 0; ty = 0;
    apply();
  }

  function toggle() {
    if (scale > 1.001) {
      reset();
    } else {
      scale = MAX;
      clampT();
      apply();
    }
  }

  function dist(t) {
    var dx = t[0].clientX - t[1].clientX;
    var dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  img.addEventListener('dragstart', function (e) { e.preventDefault(); });

  stage.addEventListener('click', function (e) {
    if (moved) { moved = false; return; }
    if (e.target && e.target.tagName === 'A') return;
    toggle();
  });

  stage.addEventListener('dblclick', function (e) {
    e.preventDefault();
    reset();
  });

  stage.addEventListener('pointerdown', function (e) {
    if (scale <= 1.001) return;
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    baseX = tx; baseY = ty;
    stage.classList.add('is-dragging');
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    tx = baseX + dx; ty = baseY + dy;
    clampT();
    apply();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', endDrag);

  /* pinch */
  var pinchFrom = 0, pinchScale = 1;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinchFrom = dist(e.touches);
      pinchScale = scale;
    }
  }, { passive: true });
  stage.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 2 || !pinchFrom) return;
    e.preventDefault();
    var d = dist(e.touches);
    scale = Math.min(MAX, Math.max(1, pinchScale * (d / pinchFrom)));
    if (scale <= 1.02) { scale = 1; tx = 0; ty = 0; }
    clampT();
    apply();
  }, { passive: false });
  stage.addEventListener('touchend', function (e) {
    if (e.touches.length < 2) pinchFrom = 0;
  }, { passive: true });

  /* keyboard: ← → walk the wall, Esc closes, + - inspect */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') { reset(); return; }
    if (e.key === '+' || e.key === '=') {
      scale = Math.min(MAX, scale + 0.5); clampT(); apply(); e.preventDefault(); return;
    }
    if (e.key === '-' || e.key === '_') {
      scale = Math.max(1, scale - 0.5);
      if (scale <= 1.001) { reset(); } else { clampT(); apply(); }
      e.preventDefault(); return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var a = document.querySelector(e.key === 'ArrowLeft' ? '.wp-pn .prev' : '.wp-pn .next');
      if (a && !a.classList.contains('off')) window.location.href = a.getAttribute('href');
    }
  });

  window.addEventListener('resize', function () { clampT(); apply(); });
})();
