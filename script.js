// ---------- Mobile nav toggle ----------
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// ---------- Depth Carousel ----------
(function () {
  var stage = document.getElementById('stage');
  var track = document.getElementById('stageTrack');
  if (!stage || !track) return;

  var items = [
    { image: 'https://picsum.photos/seed/a/800/1000', alt: 'Untitled study in blue, oil on panel' },
    { image: 'https://picsum.photos/seed/b/800/1000', alt: 'Harbor light, photograph' },
    { image: 'https://picsum.photos/seed/c/800/1000', alt: 'Low tide, mixed media' },
    { image: 'https://picsum.photos/seed/d/800/1000', alt: 'Warehouse floor no. 4' },
    { image: 'https://picsum.photos/seed/e/800/1000', alt: 'North light, ink on paper' }
  ];

  var config = {
    depth: 330,
    spread: 180,
    tilt: 22,
    tiltDirection: 'right',   // 'right' or 'left'
    perspective: 1400,
    visibleCards: 4,
    falloff: 0.2,
    blur: 6,
    autoplay: true,
    autoplayDelay: 3200,
    loop: true,
    cardWidth: 320,
    cardHeight: 370,
    radius: 24
  };

  stage.style.perspective = config.perspective + 'px';
  track.style.width = config.cardWidth + 'px';
  track.style.height = config.cardHeight + 'px';

  var current = 0;
  var count = items.length;
  var half = Math.max(1, Math.floor(config.visibleCards / 2));
  var dirSign = config.tiltDirection === 'right' ? -1 : 1;
  var autoplayTimer = null;
  var cardEls = [];

  var dotsWrap = document.getElementById('stageDots');
  var captionIdx = document.getElementById('captionIdx');
  var captionTitle = document.getElementById('captionTitle');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  function shortestOffset(index, from) {
    var raw = index - from;
    var n = count;
    var wrapped = ((raw + n / 2) % n + n) % n - n / 2;
    return config.loop ? Math.round(wrapped) : raw;
  }

  function buildCards() {
    items.forEach(function (item, i) {
      var card = document.createElement('div');
      card.className = 'stage-card';
      card.style.width = config.cardWidth + 'px';
      card.style.height = config.cardHeight + 'px';
      card.style.borderRadius = config.radius + 'px';

      var img = document.createElement('img');
      img.src = item.image;
      img.alt = item.alt;
      img.draggable = false;
      card.appendChild(img);

      card.addEventListener('click', function () {
        if (i !== current) goTo(i);
      });

      track.appendChild(card);
      cardEls.push(card);
    });
  }

  function buildDots() {
    items.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Go to piece ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
  }

  function render() {
    cardEls.forEach(function (card, i) {
      var d = shortestOffset(i, current);
      var absD = Math.abs(d);
      var visible = absD <= half;

      var scale = Math.max(0.35, 1 - config.falloff * absD);
      var opacity = visible ? Math.max(0, 1 - config.falloff * absD * 1.6) : 0;
      var blurPx = Math.min(config.blur, absD * (config.blur / Math.max(1, half)));

      var translateX = d * config.spread;
      var translateZ = -absD * config.depth;
      var rotateY = dirSign * config.tilt * d;

      card.style.transform =
        'translate(-50%, -50%) ' +
        'translateX(' + translateX + 'px) ' +
        'translateZ(' + translateZ + 'px) ' +
        'rotateY(' + rotateY + 'deg) ' +
        'scale(' + scale + ')';
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.zIndex = String(200 - absD);
      card.style.opacity = String(opacity);
      card.style.filter = absD === 0 ? 'none' : 'blur(' + blurPx.toFixed(1) + 'px)';
      card.style.pointerEvents = visible ? 'auto' : 'none';
    });

    dotsWrap.querySelectorAll('button').forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });

    captionIdx.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(count).padStart(2, '0');
    captionTitle.textContent = items[current].alt;
  }

  function goTo(index) {
    current = ((index % count) + count) % count;
    render();
    resetAutoplay();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    if (!config.autoplay) return;
    autoplayTimer = setInterval(next, config.autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Controls
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  stage.setAttribute('tabindex', '0');
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  stage.addEventListener('mouseenter', stopAutoplay);
  stage.addEventListener('mouseleave', startAutoplay);

  // Touch / drag swipe
  var dragging = false;
  var startX = 0;

  function onPointerDown(x) {
    dragging = true;
    startX = x;
    stopAutoplay();
  }
  function onPointerUp(x) {
    if (!dragging) return;
    dragging = false;
    var delta = x - startX;
    if (delta > 40) prev();
    else if (delta < -40) next();
    else resetAutoplay();
  }

  stage.addEventListener('touchstart', function (e) { onPointerDown(e.touches[0].clientX); }, { passive: true });
  stage.addEventListener('touchend', function (e) { onPointerUp(e.changedTouches[0].clientX); });

  stage.addEventListener('mousedown', function (e) { onPointerDown(e.clientX); });
  window.addEventListener('mouseup', function (e) { if (dragging) onPointerUp(e.clientX); });

  buildCards();
  buildDots();
  render();
  startAutoplay();
})();

