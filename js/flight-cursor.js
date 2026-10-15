/**
 * AeroBMSCE // Supersonic Flight-Themed Custom Cursor
 * 
 * Features:
 * - Dynamic fighter aircraft silhouette with real banking & heading physics
 * - Trailing engine afterburner flame & supersonic contrail vapor particles
 * - Interactive HUD targeting lock-on reticle for links, buttons & 3D visualizer
 * - Tactile weapon burst / click shockwave feedback
 * - Auto-disabled on mobile / touch devices for native UX integrity
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
    // 1. Build and inject Cursor DOM elements
    const cursorRoot = document.createElement('div');
    cursorRoot.id = 'flight-cursor-root';
    cursorRoot.setAttribute('aria-hidden', 'true');
    cursorRoot.innerHTML = `
      <!-- HUD Lock-On Targeting Reticle -->
      <div id="flight-cursor-reticle">
        <svg viewBox="0 0 48 48" class="w-full h-full">
          <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3" class="reticle-ring opacity-75" />
          <path d="M24 2 L24 8 M24 40 L24 46 M2 24 L8 24 M40 24 L46 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="24" cy="24" r="2" fill="currentColor" class="reticle-dot" />
        </svg>
      </div>

      <!-- Aircraft Body & Afterburner Assembly -->
      <div id="flight-cursor-aircraft">
        <!-- Supersonic Fighter Aircraft Vector (Top-Down Blueprint Profile) -->
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
            <filter id="jetGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0A47FF" flood-opacity="0.5"/>
            </filter>
          </defs>

          <!-- Wingtip Missile Rails / Pitot Stems -->
          <line x1="8" y1="36" x2="8" y2="46" stroke="#FF5722" stroke-width="1.5" stroke-linecap="round" />
          <line x1="56" y1="36" x2="56" y2="46" stroke="#FF5722" stroke-width="1.5" stroke-linecap="round" />

          <!-- Delta Wings & Foreplanes (Canards) -->
          <!-- Left Canard -->
          <polygon points="26,20 18,24 26,26" fill="#1E293B" stroke="#0A47FF" stroke-width="0.8" />
          <!-- Right Canard -->
          <polygon points="38,20 46,24 38,26" fill="#1E293B" stroke="#0A47FF" stroke-width="0.8" />

          <!-- Main Delta Wing (Reflexed Supersonic Profile) -->
          <polygon points="32,12 56,42 42,45 38,52 26,52 22,45 8,42" fill="url(#jetFuselageGrad)" stroke="#38BDF8" stroke-width="1" filter="url(#jetGlow)" />

          <!-- Wing Panel Lines & Control Surfaces -->
          <line x1="32" y1="24" x2="48" y2="42" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
          <line x1="32" y1="24" x2="16" y2="42" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
          <line x1="22" y1="44" x2="42" y2="44" stroke="rgba(255,255,255,0.25)" stroke-width="0.8" />

          <!-- Fuselage Spine -->
          <path d="M32,4 Q34,16 35,32 Q35,46 34,54 L30,54 Q29,46 29,32 Q30,16 32,4 Z" fill="#0F172A" stroke="#0A47FF" stroke-width="0.8" />

          <!-- Cockpit Canopy (Glowing Cyan HUD) -->
          <ellipse cx="32" cy="20" rx="2.5" ry="7" fill="url(#canopyGrad)" stroke="#E0F2FE" stroke-width="0.7" />

          <!-- Dual Twin Engine Nozzles -->
          <rect x="27.5" y="52" width="3.5" height="4" rx="1" fill="#FF5722" />
          <rect x="33" y="52" width="3.5" height="4" rx="1" fill="#FF5722" />
        </svg>

        <!-- Dynamic Afterburner Flame Flare -->
        <div id="flight-cursor-afterburner">
          <div class="afterburner-core"></div>
          <div class="afterburner-plume"></div>
        </div>
      </div>

      <!-- Supersonic Vapor Trail Pool (8 Nodes) -->
      <div id="flight-trail-pool">
        <div class="trail-node" id="trail-node-0"></div>
        <div class="trail-node" id="trail-node-1"></div>
        <div class="trail-node" id="trail-node-2"></div>
        <div class="trail-node" id="trail-node-3"></div>
        <div class="trail-node" id="trail-node-4"></div>
        <div class="trail-node" id="trail-node-5"></div>
        <div class="trail-node" id="trail-node-6"></div>
        <div class="trail-node" id="trail-node-7"></div>
      </div>
    `;

    document.body.appendChild(cursorRoot);
    document.body.classList.add('has-flight-cursor');

    // 2. Physics & State Variables
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

    // Trail particle ring buffer
    const TRAIL_COUNT = 8;
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
    let lastTrailDropTime = 0;

    const aircraftEl = document.getElementById('flight-cursor-aircraft');
    const reticleEl = document.getElementById('flight-cursor-reticle');
    const afterburnerEl = document.getElementById('flight-cursor-afterburner');

    // 3. Track Mouse Coordinates
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

    // 4. Mouse Down / Up Tactile Weapon Burst
    window.addEventListener('mousedown', () => {
      isFiring = true;
      cursorRoot.classList.add('is-firing');
    });

    window.addEventListener('mouseup', () => {
      isFiring = false;
      cursorRoot.classList.remove('is-firing');
    });

    // 5. Interactive Element Lock-On Hover Listeners
    const interactiveSelector = `
      a, button, input, textarea, select, 
      .hotspot-quick-btn, .team-tab-btn, .milestone-filter-btn, 
      .partner-logo-box, .mobile-nav-item, #contact-submit-btn,
      #hero-three-canvas-container, [role="button"]
    `;

    function attachHoverListeners() {
      const targets = document.querySelectorAll(interactiveSelector);
      targets.forEach((target) => {
        target.addEventListener('mouseenter', () => {
          isLockedOn = true;
          cursorRoot.classList.add('is-locked-on');
        });
        target.addEventListener('mouseleave', () => {
          isLockedOn = false;
          cursorRoot.classList.remove('is-locked-on');
        });
      });
    }

    attachHoverListeners();

    // Re-check periodically or after DOM mutations for dynamically shown buttons
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        attachHoverListeners();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // 6. Smooth Physics Animation Loop (60-120fps)
    let lastTime = performance.now();

    function renderLoop(now) {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Position interpolation (lerp)
      const lerpFactor = 0.28;
      const dx = mouseX - currentX;
      const dy = mouseY - currentY;
      currentX += dx * lerpFactor;
      currentY += dy * lerpFactor;

      // Compute speed velocity
      const distance = Math.hypot(dx, dy);
      velocity = velocity * 0.8 + distance * 0.2;

      // Calculate heading angle when moving
      if (distance > 1.8) {
        // Top-down aircraft points up (90deg offset from Math.atan2)
        const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

        // Smooth shortest-path angle wrapping
        let diff = (rawAngle - targetAngle) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        targetAngle += diff;

        // Damped banking interpolation
        const angleLerp = 0.22;
        currentAngle += (targetAngle - currentAngle) * angleLerp;
      } else {
        // Idle relaxation: gently stabilize heading
        currentAngle += (0 - (currentAngle % 360)) * 0.05;
      }

      // Dynamic scale & banking
      const speedScale = Math.min(1 + velocity * 0.008, 1.25);
      const lockOnScale = isLockedOn ? 1.15 : 1.0;
      const fireScale = isFiring ? 0.85 : 1.0;
      const finalScale = speedScale * lockOnScale * fireScale;

      // Transform Aircraft
      if (aircraftEl) {
        aircraftEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${currentAngle}deg) scale(${finalScale})`;
      }

      // Reticle stays centered with mouse, rotating continuously when locked on
      if (reticleEl) {
        reticleEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${isLockedOn ? 1.0 : 0.6})`;
      }

      // Afterburner intensity scales with velocity
      if (afterburnerEl) {
        const burnerScale = Math.min(0.6 + velocity * 0.08 + (isLockedOn ? 0.4 : 0), 2.2);
        const burnerOpacity = Math.min(0.4 + velocity * 0.06 + (isLockedOn ? 0.5 : 0), 1.0);
        afterburnerEl.style.transform = `scaleY(${burnerScale}) scaleX(${Math.min(burnerScale * 0.8, 1.4)})`;
        afterburnerEl.style.opacity = burnerOpacity.toString();
      }

      // Emit Contrail Particle when moving at sufficient speed
      if (velocity > 3.0 && now - lastTrailDropTime > 35) {
        lastTrailDropTime = now;
        const node = trailNodes[trailIndex];
        // Calculate emission point at tail of aircraft (offset ~26px backward)
        const rad = (currentAngle - 90) * (Math.PI / 180);
        const tailOffset = 22;
        node.x = currentX - Math.sin(rad) * tailOffset;
        node.y = currentY + Math.cos(rad) * tailOffset;
        node.life = 1.0;
        node.size = 6 + Math.min(velocity * 0.2, 8);
        trailIndex = (trailIndex + 1) % TRAIL_COUNT;
      }

      // Update and render trail particles
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const p = trailNodes[i];
        if (p.life > 0.02) {
          p.life -= delta * 2.8; // Fades out in ~350ms
          p.size += delta * 14;  // Expands like real vapor
          const alpha = Math.max(p.life * 0.45, 0);
          p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.size / 6})`;
          p.el.style.opacity = alpha.toFixed(3);
          p.el.style.display = 'block';
        } else {
          p.el.style.display = 'none';
        }
      }

      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
  }
})();
