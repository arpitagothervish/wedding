/* =========================================================
   ARPITA & VISHAL — WEDDING SITE
   main.js
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1. DOOR INTRO — double-tap / double-click to open
  --------------------------------------------------------- */
  const doorScreen   = document.getElementById('door-screen');
  const closedVideo  = document.getElementById('doorClosedVideo');
  const openVideo    = document.getElementById('doorOpenVideo');
  const mainSite     = document.getElementById('main-site');
  const bgMusic      = document.getElementById('bgMusic');

  let doorOpened = false;

  // Background music replaces the door videos' own audio entirely — both
  // door-closed.mp4 and door-open.mp4 stay muted (see the `muted` attribute
  // on each <video> in the HTML, and openDoor() below never unmutes them).
  //
  // The track should start as close to "the moment the page loads" as
  // browsers allow. Autoplay-with-sound is blocked without a user gesture,
  // so we: (1) try to play immediately on load — works in some browsers/
  // contexts, and (2) if that's blocked, start it on the visitor's very
  // first tap/click/key anywhere on the page — which fires on the *first*
  // tap of the door, not the second tap that actually opens it.
  let bgMusicStarted = false;
  function startBgMusic(){
    if (bgMusicStarted || !bgMusic) return;
    const p = bgMusic.play();
    if (p) {
      p.then(() => { bgMusicStarted = true; setMusicIcon(true); })
       .catch(() => { /* still blocked — first-interaction listener below will retry */ });
    }
  }

  if (bgMusic) bgMusic.volume = 0.55;
  startBgMusic();

  const firstInteractionEvents = ['pointerdown','touchstart','mousedown','click','keydown'];
  function armMusicUnlock(){
    const handler = () => {
      startBgMusic();
      firstInteractionEvents.forEach(evt => document.removeEventListener(evt, handler));
    };
    firstInteractionEvents.forEach(evt => document.addEventListener(evt, handler, { passive:true }));
  }
  armMusicUnlock();

  function openDoor(){
    if (doorOpened) return;
    doorOpened = true;

    doorScreen.classList.add('knocked');

    // swap videos
    closedVideo.classList.remove('active');
    openVideo.classList.add('active');
    openVideo.currentTime = 0;

    // stays muted — background music (started earlier) carries the audio now
    const playPromise = openVideo.play();
    if (playPromise) playPromise.catch(() => {});

    // safety fallback in case 'ended' never fires (video missing, etc.)
    const fallbackTimer = setTimeout(finishReveal, 6000);

    openVideo.addEventListener('ended', () => {
      clearTimeout(fallbackTimer);
      finishReveal();
    }, { once:true });

    // if the open-door video file is missing entirely, reveal after a short pause
    openVideo.addEventListener('error', () => {
      clearTimeout(fallbackTimer);
      setTimeout(finishReveal, 800);
    }, { once:true });
  }

  function finishReveal(){
    // instant cut, no fade — door-open.mp4's last frame is designed to
    // match couple-hero.jpg, so hiding the door immediately makes it look
    // like the door opened straight into the site rather than crossfading
    doorScreen.classList.add('door-exit');
    doorScreen.style.display = 'none';
    mainSite.classList.add('revealed');
    document.body.style.overflow = 'auto';

    // fallback in case the gesture-triggered start above never fired
    startBgMusic();
  }

  // lock scroll until door opens
  document.body.style.overflow = 'hidden';

  // double-click (desktop + most mobile browsers fire this on double-tap)
  doorScreen.addEventListener('dblclick', openDoor);

  // manual double-tap detection fallback for touch devices
  let lastTap = 0;
  doorScreen.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 320) {
      e.preventDefault();
      openDoor();
    }
    lastTap = now;
  });

  /* ---------------------------------------------------------
     2. MUSIC TOGGLE
  --------------------------------------------------------- */
  const musicBtn  = document.getElementById('music-toggle');
  const iconMute  = document.getElementById('icon-mute');
  const iconUnmute= document.getElementById('icon-unmute');

  function setMusicIcon(playing){
    if (!iconMute || !iconUnmute) return;
    iconMute.style.display   = playing ? 'none' : 'block';
    iconUnmute.style.display = playing ? 'block' : 'none';
    musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  if (musicBtn && bgMusic){
    musicBtn.addEventListener('click', () => {
      if (bgMusic.paused){
        bgMusic.play().then(() => setMusicIcon(true)).catch(()=>{});
      } else {
        bgMusic.pause();
        setMusicIcon(false);
      }
    });
  }

  /* ---------------------------------------------------------
     3. FLOWER FIELD — fixed to the viewport (not the hero), so it
        isn't clipped when the hero scrolls away. Drifts at a fraction
        of normal scroll speed so it lags behind and lingers on screen
        after the hero background is gone, then fades out once the
        visitor has scrolled well past it.
  --------------------------------------------------------- */
  const flowerField = document.getElementById('flower-field');

  if (flowerField){
    const FLOWER_SPEED  = 0.16;  // fraction of normal scroll speed — lower = lags further behind
    const FADE_START_VH = 2.2;   // starts fading after this many viewport-heights of scroll — past the scratch section
    const FADE_END_VH   = 3.0;   // fully faded by this many viewport-heights

    let flowerTicking = false;

    function updateFlowerField(){
      const y  = window.scrollY;
      const vh = window.innerHeight;

      flowerField.style.transform = `translate3d(0, ${-y * FLOWER_SPEED}px, 0)`;

      const fadeRange = (FADE_END_VH - FADE_START_VH) * vh;
      const progress  = (y - FADE_START_VH * vh) / fadeRange;
      const opacity   = 1 - Math.min(Math.max(progress, 0), 1);

      flowerField.style.opacity    = opacity;
      flowerField.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';

      flowerTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!flowerTicking){
        requestAnimationFrame(updateFlowerField);
        flowerTicking = true;
      }
    }, { passive:true });

    updateFlowerField();
  }

  /* ---------------------------------------------------------
     3.5 CONFETTI BURST — fires once the scratch card is fully
     revealed. Self-contained canvas particle burst (no external
     library/CDN dependency), using the site's own palette so it
     reads as celebratory rather than generic rainbow confetti.
  --------------------------------------------------------- */
  function launchConfetti(originEl){
    const colors = ['#c9a35a', '#e8cd94', '#d98fa0', '#6b1f2a', '#8a9a6f', '#ffffff'];

    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.setAttribute('aria-hidden', 'true');
    Object.assign(confettiCanvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '600'
    });
    document.body.appendChild(confettiCanvas);

    const dpr = window.devicePixelRatio || 1;
    function sizeConfettiCanvas(){
      confettiCanvas.width  = window.innerWidth * dpr;
      confettiCanvas.height = window.innerHeight * dpr;
    }
    sizeConfettiCanvas();
    const cctx = confettiCanvas.getContext('2d');
    cctx.scale(dpr, dpr);

    // burst originates from the element that triggered it (the scratch
    // card), falls back to upper-center of the viewport
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight * 0.35;
    if (originEl){
      const rect = originEl.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    const PARTICLE_COUNT = 140;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++){
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // slight upward bias so it "blasts" outward
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    const GRAVITY = 0.22;
    const DRAG = 0.985;
    const DURATION = 2600;
    let start = null;

    function frame(ts){
      if (!start) start = ts;
      const elapsed = ts - start;
      cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      particles.forEach(p => {
        p.vx *= DRAG;
        p.vy = p.vy * DRAG + GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        const life = Math.max(0, 1 - elapsed / DURATION);

        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rotation);
        cctx.globalAlpha = life;
        cctx.fillStyle = p.color;
        if (p.shape === 'rect'){
          cctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else {
          cctx.beginPath();
          cctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          cctx.fill();
        }
        cctx.restore();
      });

      if (elapsed < DURATION){
        requestAnimationFrame(frame);
      } else {
        confettiCanvas.remove();
        window.removeEventListener('resize', sizeConfettiCanvas);
      }
    }

    window.addEventListener('resize', sizeConfettiCanvas);
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     4. SCRATCH CARD
  --------------------------------------------------------- */
  const canvas = document.getElementById('scratchCanvas');
  const countdownWrap = document.getElementById('countdownWrap');

  if (canvas){
    const ctx = canvas.getContext('2d');
    let scratching = false;
    let revealed = false;

    function sizeCanvas(){
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawScratchLayer();
    }

    function heartPath(w, h){
      // normalized heart (0..1 in both axes), same shape as the
      // #heartClip path behind it in the HTML — scaled to canvas pixels
      ctx.beginPath();
      ctx.moveTo(0.5*w, 1*h);
      ctx.lineTo(0.4275*w, 0.9282*h);
      ctx.bezierCurveTo(0.17*w,0.6734*h, 0*w,0.5057*h, 0*w,0.2997*h);
      ctx.bezierCurveTo(0*w,0.1318*h, 0.1211*w,0*h, 0.275*w,0*h);
      ctx.bezierCurveTo(0.362*w,0*h, 0.4455*w,0.0442*h, 0.5*w,0.1139*h);
      ctx.bezierCurveTo(0.5545*w,0.0442*h, 0.638*w,0*h, 0.725*w,0*h);
      ctx.bezierCurveTo(0.879*w,0*h, 1*w,0.1318*h, 1*w,0.2997*h);
      ctx.bezierCurveTo(1*w,0.5057*h, 0.83*w,0.6734*h, 0.5725*w,0.9282*h);
      ctx.lineTo(0.5*w, 1*h);
      ctx.closePath();
    }

    function drawScratchLayer(){
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      // solid pink heart drawn straight on the canvas — no image. Deeper/
      // more saturated than the reveal layer's own pink underneath, so
      // scratching it away is visible instead of pink-on-pink with no contrast.
      heartPath(w, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ec7ba0');
      grad.addColorStop(1, '#d94f7c');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function getPos(e){
      const rect = canvas.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      };
    }

    function scratchAt(x, y){
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    function checkProgress(){
      if (revealed) return;
      const w = canvas.width, h = canvas.height;
      const data = ctx.getImageData(0, 0, w, h).data;
      let cleared = 0;
      const step = 4 * 8; // sample every 8th pixel for performance
      let total = 0;
      for (let i = 3; i < data.length; i += step){
        total++;
        if (data[i] < 60) cleared++;
      }
      const pct = cleared / total;
      if (pct > 0.5){
        revealScratchCard();
      }
    }

    function revealScratchCard(){
      revealed = true;
      canvas.classList.add('done');
      countdownWrap.classList.add('show');
      startCountdown();
      launchConfetti(document.getElementById('scratchCard'));
    }

    function handleMove(e){
      if (!scratching) return;
      const { x, y } = getPos(e);
      scratchAt(x, y);
      e.preventDefault();
    }

    canvas.addEventListener('mousedown', (e) => { scratching = true; const {x,y}=getPos(e); scratchAt(x,y); });
    window.addEventListener('mouseup', () => { if (scratching){ scratching=false; checkProgress(); } });
    canvas.addEventListener('mousemove', handleMove);

    canvas.addEventListener('touchstart', (e) => { scratching = true; const {x,y}=getPos(e); scratchAt(x,y); e.preventDefault(); }, { passive:false });
    canvas.addEventListener('touchmove', handleMove, { passive:false });
    canvas.addEventListener('touchend', () => { if (scratching){ scratching=false; checkProgress(); } });

    window.addEventListener('resize', sizeCanvas);
    // slight delay so layout / fonts settle before measuring
    setTimeout(sizeCanvas, 50);
  }

  /* ---------------------------------------------------------
     5. COUNTDOWN
  --------------------------------------------------------- */
  const WEDDING_DATE = new Date('2026-12-04T12:30:00');
  let countdownStarted = false;
  let countdownInterval = null;

  function startCountdown(){
    if (countdownStarted) return;
    countdownStarted = true;

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    function tick(){
      const now = new Date();
      let diff = WEDDING_DATE - now;
      if (diff < 0) diff = 0;

      const days  = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff / (1000*60*60)) % 24);
      const mins  = Math.floor((diff / (1000*60)) % 60);
      const secs  = Math.floor((diff / 1000) % 60);

      dEl.textContent = String(days).padStart(2,'0');
      hEl.textContent = String(hours).padStart(2,'0');
      mEl.textContent = String(mins).padStart(2,'0');
      sEl.textContent = String(secs).padStart(2,'0');

      if (diff <= 0) clearInterval(countdownInterval);
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     6. SCROLL REVEAL ANIMATIONS
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal-up');
  if ('IntersectionObserver' in window){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------------------------------------------------------
     7. DOT NAV — active state on scroll
  --------------------------------------------------------- */
  const dots = document.querySelectorAll('#dot-nav .dot');
  const navSections = ['hero','scratch','schedule','dresscode','location']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (dots.length && 'IntersectionObserver' in window){
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          const idx = navSections.indexOf(entry.target);
          dots.forEach(d => d.classList.remove('active'));
          if (dots[idx]) dots[idx].classList.add('active');
        }
      });
    }, { threshold: 0.4 });
    navSections.forEach(sec => navObserver.observe(sec));
  }

  /* ---------------------------------------------------------
     8. AUTOPLAY EVENT VIDEOS WHEN IN VIEW (schedule section)
  --------------------------------------------------------- */
  const eventVideos = document.querySelectorAll('.event-video');
  if (eventVideos.length && 'IntersectionObserver' in window){
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target;
        if (entry.isIntersecting){
          vid.play().catch(()=>{});
        } else {
          vid.pause();
        }
      });
    }, { threshold: 0.3 });
    eventVideos.forEach(v => videoObserver.observe(v));
  }

});
