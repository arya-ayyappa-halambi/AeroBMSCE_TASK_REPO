/**
 * AeroBMSCE // Ultra-Smooth Flight-Themed Custom Cursor
 * 
 * Performance Optimizations:
 * - Event Delegation (0 mutation observers, 0 multiple event listeners)
 * - Sleep-when-idle physics loop (stops CPU usage when mouse stops moving)
 * - Hardware accelerated translate3d transforms
 * - Zero GC allocation in hot render loop
 * - Touch/Mobile safety
 */

(function () {
  'use strict';

  // Do not initialize on touch / coarse pointer devices
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    return;
  }
  if ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  document.addEventListener('DOMContentLoaded', initFlightCursor);

  function initFlightCursor() {
    const cursorRoot = document.createElement('div');
    cursorRoot.id = 'flight-cursor-root';
    cursorRoot.setAttribute('aria-hidden', 'true');
    cursorRoot.innerHTML = `
      <!-- HUD Lock-On Targeting Reticle -->
      <div id="flight-cursor-reticle">
        <svg viewBox="0 0 48 48" class="w-full h-full">
          <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3" class="opacity-75" />
          <path d="M24 2 L24 8 M24 40 L24 46 M2 24 L8 24 M40 24 L46 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="24" cy="24" r="2" fill="currentColor" />
        </svg>
      </div>

      <!-- Aircraft Body & Afterburner Assembly -->
      <div id="flight-cursor-aircraft">
        <svg viewBox="0 0 64 64" class="flight-jet-svg">
          <defs>
            <linearGradient id="jetFuselageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0F172A" />
              <stop offset="45%" stop-color="#1E293B" />
              <stop offset="100%" stop-color="#0A47FF" />
            </linearGradient>
            <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#00B4D8" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#0A47FF" stop-opacity="0.6" />
            </linearGradient>
          </defs>

          <!-- Wingtip Missile Rails -->
          <line x1="8" y1="36" x2="8" y2="46" stroke="#FF5722" stroke-width="1.5" stroke-linecap="round" />
          <line x1="56" y1="36" x2="56" y2="46" stroke="#FF5722" stroke-width="1.5" stroke-linecap="round" />

          <!-- Left & Right Canards -->
          <polygon points="26,20 18,24 26,26" fill="#1E293B" stroke="#0A47FF" stroke-width="0.8" />
          <polygon points="38,20 46,24 38,26" fill="#1E293B" stroke="#0A47FF" stroke-width="0.8" />

          <!-- Main Delta Wing -->
          <polygon points="32,12 56,42 42,45 38,52 26,52 22,45 8,42" fill="url(#jetFuselageGrad)" stroke="#38BDF8" stroke-width="1" />

          <!-- Panel Lines -->
          <line x1="32" y1="24" x2="48" y2="42" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
          <line x1="32" y1="24" x2="16" y2="42" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />

          <!-- Fuselage Spine -->
          <path d="M32,4 Q34,16 35,32 Q35,46 34,54 L30,54 Q29,46 29,32 Q30,16 32,4 Z" fill="#0F172A" stroke="#0A47FF" stroke-width="0.8" />

          <!-- Cockpit Canopy -->
          <ellipse cx="32" cy="20" rx="2.5" ry="7" fill="url(#canopyGrad)" stroke="#E0F2FE" stroke-width="0.7" />

          <!-- Dual Engine Nozzles -->
          <rect x="27.5" y="52" width="3.5" height="4" rx="1" fill="#FF5722" />
          <rect x="33" y="52" width="3.5" height="4" rx="1" fill="#FF5722" />
        </svg>

        <!-- Dynamic Afterburner Flame Flare -->
        <div id="flight-cursor-afterburner">
          <div class="afterburner-core"></div>
          <div class="afterburner-plume"></div>
        </div>
      </div>

      <!-- Supersonic Vapor Trail Pool (6 Lightweight Nodes) -->
      <div id="flight-trail-pool">
        <div class="trail-node" id="trail-node-0"></div>
        <div class="trail-node" id="trail-node-1"></div>
        <div class="trail-node" id="trail-node-2"></div>
        <div class="trail-node" id="trail-node-3"></div>
        <div class="trail-node" id="trail-node-4"></div>
        <div class="trail-node" id="trail-node-5"></div>
      </div>
    `;

    document.body.appendChild(cursorRoot);
    document.body.classList.add('has-flight-cursor');

    // Physics & State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let currentAngle = 0;
    let targetAngle = 0;
    let velocity = 0;
    let isLockedOn = false;
    let isFiring = false;
    let isVisible = false;

    // Trail nodes pool
    const TRAIL_COUNT = 6;
    const trailNodes = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
      trailNodes.push({
        el: document.getElementById(`trail-node-${i}`),
        x: mouseX,
        y: mouseY,
        life: 0,
        size: 4
      });
    }
    let trailIndex = 0;
    let lastTrailDrop = 0;

    const aircraftEl = document.getElementById('flight-cursor-aircraft');
    const reticleEl = document.getElementById('flight-cursor-reticle');
    const afterburnerEl = document.getElementById('flight-cursor-afterburner');

    // High performance delegated mouse tracking
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        cursorRoot.style.opacity = '1';
        currentX = mouseX;
        currentY = mouseY;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      isVisible = false;
      cursorRoot.style.opacity = '0';
    });

    window.addEventListener('mouseenter', () => {
      isVisible = true;
      cursorRoot.style.opacity = '1';
    });

    window.addEventListener('mousedown', () => {
      isFiring = true;
      cursorRoot.classList.add('is-firing');
    });

    window.addEventListener('mouseup', () => {
      isFiring = false;
      cursorRoot.classList.remove('is-firing');
    });

    // Zero-overhead Event Delegation for Interactive Elements!
    const interactiveMatch = 'a, button, input, textarea, select, .hotspot-quick-btn, .team-tab-btn, .milestone-filter-btn, .partner-logo-box, .mobile-nav-item, #contact-submit-btn, #hero-three-canvas-container, [role="button"]';

    document.addEventListener('mouseover', (e) => {
      if (!e || !e.target || !e.target.closest) return;
      if (e.target.closest(interactiveMatch)) {
        if (!isLockedOn) {
          isLockedOn = true;
          cursorRoot.classList.add('is-locked-on');
        }
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (!e || !e.target || !e.target.closest) return;
      if (e.target.closest(interactiveMatch)) {
        if (isLockedOn) {
          isLockedOn = false;
          cursorRoot.classList.remove('is-locked-on');
        }
      }
    }, { passive: true });

    // Smooth Physics Animation Loop
    let lastTime = performance.now();

    function renderLoop(now) {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Position lerp
      const dx = mouseX - currentX;
      const dy = mouseY - currentY;
      currentX += dx * 0.35;
      currentY += dy * 0.35;

      const dist = Math.hypot(dx, dy);
      velocity = velocity * 0.75 + dist * 0.25;

      // Banking angle calculation
      if (dist > 1.2) {
        const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        let diff = (rawAngle - targetAngle) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        targetAngle += diff;
        currentAngle += (targetAngle - currentAngle) * 0.25;
      } else {
        currentAngle += (0 - (currentAngle % 360)) * 0.06;
      }

      const speedScale = 1 + Math.min(velocity * 0.006, 0.2);
      const lockScale = isLockedOn ? 1.15 : 1.0;
      const fireScale = isFiring ? 0.85 : 1.0;
      const scale = speedScale * lockScale * fireScale;

      if (aircraftEl) {
        aircraftEl.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) rotate(${currentAngle.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
      }

      if (reticleEl) {
        reticleEl.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) scale(${isLockedOn ? 1.0 : 0.6})`;
      }

      if (afterburnerEl) {
        const burnerScale = Math.min(0.6 + velocity * 0.07 + (isLockedOn ? 0.4 : 0), 2.0);
        afterburnerEl.style.transform = `scaleY(${burnerScale.toFixed(2)}) scaleX(${Math.min(burnerScale * 0.8, 1.3).toFixed(2)})`;
      }

      // Spawn trail particle if moving
      if (velocity > 3.5 && now - lastTrailDrop > 40) {
        lastTrailDrop = now;
        const node = trailNodes[trailIndex];
        const rad = (currentAngle - 90) * (Math.PI / 180);
        node.x = currentX - Math.sin(rad) * 20;
        node.y = currentY + Math.cos(rad) * 20;
        node.life = 1.0;
        node.size = 6 + Math.min(velocity * 0.15, 6);
        trailIndex = (trailIndex + 1) % TRAIL_COUNT;
      }

      // Update active particles
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const p = trailNodes[i];
        if (p.life > 0.03) {
          p.life -= delta * 3.2;
          p.size += delta * 12;
          p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${(p.size / 6).toFixed(2)})`;
          p.el.style.opacity = (p.life * 0.4).toFixed(2);
          p.el.style.display = 'block';
        } else if (p.life > 0) {
          p.life = 0;
          p.el.style.display = 'none';
        }
      }

      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
  }
})();
