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

  // Both door videos stay muted throughout (they keep their `muted` attribute
  // from the markup — nothing here unmutes them). Playing their own audio
  // would cut out abruptly the moment the video ends, which made the
  // door->hero handoff sound obviously stitched together even after the
  // visual transition became seamless. Instead the background music starts
  // on the visitor's first gesture and plays continuously through the whole
  // door + hero experience, so there's one unbroken audio track and no seam.
  // Several event types are listened for since not all of them count as a
  // valid "user gesture" for audio on every browser (iOS Safari in
  // particular can ignore pointerdown) — the guard makes the rest no-ops.
  let bgMusicStarted = false;
  function startBgMusic(){
    if (bgMusicStarted || !bgMusic) return;
    bgMusicStarted = true;
    bgMusic.volume = 0.55;
    bgMusic.play().then(() => setMusicIcon(true)).catch(() => setMusicIcon(false));
  }
  ['pointerdown','touchstart','mousedown','click'].forEach(evt => {
    doorScreen.addEventListener(evt, startBgMusic, { once:true, passive:true });
  });

  function openDoor(){
    if (doorOpened) return;
    doorOpened = true;

    doorScreen.classList.add('knocked');

    // swap videos (both stay muted — see startBgMusic above)
    closedVideo.classList.remove('active');
    openVideo.classList.add('active');
    openVideo.currentTime = 0;
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
     3. LANTERN FIELD — fixed to the viewport (not the hero), so it
        isn't clipped when the hero scrolls away. Drifts at a fraction
        of normal scroll speed so it lags behind and lingers on screen
        after the hero background is gone, then fades out once the
        visitor has scrolled well past it.
  --------------------------------------------------------- */
  const lanternField = document.getElementById('lantern-field');

  if (lanternField){
    const LANTERN_SPEED = 0.28;  // fraction of normal scroll speed — lower = lags further behind
    const FADE_START_VH = 1.15;  // starts fading after this many viewport-heights of scroll
    const FADE_END_VH   = 2.1;   // fully faded by this many viewport-heights

    let lanternTicking = false;

    function updateLanternField(){
      const y  = window.scrollY;
      const vh = window.innerHeight;

      lanternField.style.transform = `translate3d(0, ${-y * LANTERN_SPEED}px, 0)`;

      const fadeRange = (FADE_END_VH - FADE_START_VH) * vh;
      const progress  = (y - FADE_START_VH * vh) / fadeRange;
      const opacity   = 1 - Math.min(Math.max(progress, 0), 1);

      lanternField.style.opacity    = opacity;
      lanternField.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';

      lanternTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!lanternTicking){
        requestAnimationFrame(updateLanternField);
        lanternTicking = true;
      }
    }, { passive:true });

    updateLanternField();
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

    function drawScratchLayer(){
      const w = canvas.width, h = canvas.height;
      ctx.globalCompositeOperation = 'source-over';

      // opaque gold base first so nothing peeks through before the heart
      // texture (which has a transparent background) loads on top of it
      paintGoldFallback();

      const img = new Image();
      img.onload = () => {
        // contain-fit, centered — the source PNG isn't square, so drawing
        // it stretched to the canvas's exact w/h would squash the heart
        const scale = Math.min(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      };
      img.src = 'assets/images/scratch-overlay.png';
    }

    function paintGoldFallback(){
      const w = canvas.width, h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#e9cf94');
      grad.addColorStop(0.5, '#c9a35a');
      grad.addColorStop(1, '#a8823f');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '600 13px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ scratch me ✦', w/2, h/2);
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
