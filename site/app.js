/* YouBox.Fit · web pitch — vanilla deck controller */
(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var dots = document.getElementById('dots');
  var live = document.getElementById('live');
  var presenter = document.getElementById('presenter');
  var presenterSlide = document.getElementById('presenter-slide');
  var notesEl = document.getElementById('notes');
  var timerEl = document.getElementById('timer');
  var btnPresenter = document.getElementById('btn-presenter');
  var btnFullscreen = document.getElementById('btn-fullscreen');
  var btnReset = document.getElementById('btn-reset');
  var inst = document.getElementById('inst-block');

  var STAGE_W = 1920, STAGE_H = 1080, FLUID_BP = 900, TARGET_S = 240;
  var current = 0;
  var notes = {};
  try { notes = JSON.parse(document.getElementById('speaker-notes').textContent) || {}; } catch (e) {}

  /* ---------- stage scaling ---------- */
  function fit() {
    if (window.innerWidth < FLUID_BP) { stage.style.removeProperty('--scale'); return; }
    var s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.setProperty('--scale', s.toFixed(4));
  }

  /* ---------- navigation ---------- */
  function clamp(n) { return Math.max(0, Math.min(total - 1, n)); }

  function show(n, fromHash) {
    n = clamp(n);
    var back = n < current;
    slides.forEach(function (s, i) {
      var active = i === n;
      s.classList.toggle('is-active', active);
      s.classList.toggle('is-leaving-back', !active && i > n && back);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) {
        s.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
      }
    });
    current = n;
    deck.setAttribute('data-slide', String(n + 1));
    if (!fromHash) history.replaceState(null, '', '#' + (n + 1));
    updateDots();
    live.textContent = slides[n].getAttribute('aria-label');
    presenterSlide.textContent = (n + 1) + ' / ' + total;
    notesEl.textContent = notes[String(n + 1)] || '';
    /* preload neighbour */
    var next = slides[n + 1];
    if (next) next.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
  }

  function go(delta) { show(current + delta); }

  function fromHash() {
    var m = /^#(\d+)$/.exec(location.hash);
    show(m ? parseInt(m[1], 10) - 1 : 0, true);
  }

  /* ---------- dots ---------- */
  slides.forEach(function (s, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
    b.addEventListener('click', function () { show(i); });
    li.appendChild(b);
    dots.appendChild(li);
  });
  function updateDots() {
    dots.querySelectorAll('.dot').forEach(function (d, i) {
      if (i === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }

  /* ---------- presenter mode & timer ---------- */
  var startedAt = null, tick = null;
  function fmt(s) { var m = Math.floor(s / 60); s = s % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function renderTimer() {
    var el = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    timerEl.innerHTML = fmt(el) + ' <small>/ ' + fmt(TARGET_S) + '</small>';
    timerEl.classList.toggle('is-warn', el >= TARGET_S - 30 && el < TARGET_S);
    timerEl.classList.toggle('is-over', el >= TARGET_S);
  }
  function startTimer() { if (!startedAt) startedAt = Date.now(); if (!tick) tick = setInterval(renderTimer, 500); renderTimer(); }
  function resetTimer() { startedAt = Date.now(); renderTimer(); }
  function togglePresenter(force) {
    var on = typeof force === 'boolean' ? force : presenter.hidden;
    presenter.hidden = !on;
    btnPresenter.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) startTimer();
  }

  function toggleFullscreen() {
    var d = document;
    if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || function () {}).call(d.documentElement); }
    else if (d.exitFullscreen) d.exitFullscreen();
  }

  /* ---------- input ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
        if (t && t.classList && (t.classList.contains('ctl') || t.classList.contains('dot')) && (e.key === ' ' || e.key === 'Enter')) return;
        e.preventDefault(); go(1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); go(-1); break;
      case 'Home': e.preventDefault(); show(0); break;
      case 'End': e.preventDefault(); show(total - 1); break;
      case 'p': case 'P': togglePresenter(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'r': case 'R': if (!presenter.hidden) resetTimer(); break;
      case 'Escape': if (!presenter.hidden) togglePresenter(false); break;
      default:
        if (/^[1-9]$/.test(e.key)) show(parseInt(e.key, 10) - 1);
    }
  });

  document.querySelectorAll('[data-nav]').forEach(function (el) {
    el.addEventListener('click', function () { go(parseInt(el.getAttribute('data-nav'), 10)); });
  });
  btnPresenter.addEventListener('click', function () { togglePresenter(); });
  btnFullscreen.addEventListener('click', toggleFullscreen);
  btnReset.addEventListener('click', resetTimer);

  /* swipe */
  var tx = null, ty = null;
  deck.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* show floating controls briefly on mouse move */
  var hideCtl;
  document.addEventListener('mousemove', function () {
    document.body.classList.add('show-controls');
    clearTimeout(hideCtl);
    hideCtl = setTimeout(function () { document.body.classList.remove('show-controls'); }, 2500);
  });

  /* ---------- missing media → styled placeholder ---------- */
  document.querySelectorAll('.media img, .bg img').forEach(function (img) {
    var fig = img.closest('figure');
    function missing() { if (fig) fig.classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) missing();
    img.addEventListener('error', missing);
  });
  if (inst) {
    var svg = inst.querySelector('img');
    if (svg) svg.addEventListener('error', function () { inst.classList.add('is-missing'); });
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  window.addEventListener('hashchange', fromHash);
  fit();
  fromHash();
})();
