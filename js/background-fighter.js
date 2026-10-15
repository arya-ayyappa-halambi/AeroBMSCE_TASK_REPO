/**
 * AeroBMSCE // Scroll-Reactive Glowing Fighter Aircraft Background
 * 
 * Features:
 * - Real supersonic fighter aircraft CAD/blueprint vector (HAL Tejas / Su-30MKI inspired)
 * - Dynamic scroll-reactive twin turbofan afterburner reheat ignition
 * - Parallax 3D pitch & altitude climb animation
 * - Dynamic HUD avionics & telemetry readouts (Altitude, Mach, Reheat %)
 * - Calibrated atmospheric glow to preserve 100% content legibility
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initBackgroundFighter);

  function initBackgroundFighter() {
    // 1. Build and inject Background Fighter DOM container
    const container = document.createElement('div');
    container.id = 'background-fighter-container';
    container.setAttribute('aria-hidden', 'true');
    container.innerHTML = `
      <!-- Stratospheric Ambient Light Horizon -->
      <div id="bg-horizon-flare"></div>

      <!-- Live Flight HUD Telemetry Overlay (Subtle Corner Readouts) -->
      <div id="bg-hud-telemetry" class="hidden lg:flex">
        <div class="hud-item">
          <span class="hud-label">ALTITUDE</span>
          <span id="hud-val-alt" class="hud-value">12,400 FT</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">AIRSPEED</span>
          <span id="hud-val-mach" class="hud-value">MACH 0.88</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">TURBOFAN REHEAT</span>
          <div class="hud-meter-bar">
            <div id="hud-meter-fill" class="hud-meter-progress"></div>
          </div>
          <span id="hud-val-thrust" class="hud-value text-aero-orange">25%</span>
        </div>
      </div>

      <!-- Aircraft 3D Parallax Stage Wrapper -->
      <div id="bg-fighter-stage">
        <svg id="bg-fighter-svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Fuselage Blueprint Gradient -->
            <linearGradient id="bgFuselageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0A47FF" stop-opacity="0.25" />
              <stop offset="50%" stop-color="#002B99" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#0F172A" stop-opacity="0.28" />
            </linearGradient>

            <!-- Afterburner Reheat Core Gradient -->
            <radialGradient id="reheatCoreGrad" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
              <stop offset="25%" stop-color="#38BDF8" stop-opacity="0.95" />
              <stop offset="60%" stop-color="#0A47FF" stop-opacity="0.8" />
              <stop offset="85%" stop-color="#FF5722" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#FF5722" stop-opacity="0" />
            </radialGradient>

            <!-- Radar Sweep Gradient -->
            <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0" />
              <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#0A47FF" stop-opacity="0" />
            </linearGradient>

            <!-- Neon Glow Filters -->
            <filter id="neonBlueGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="15" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="afterburnerGlow" x="-50%" y="-20%" width="200%" height="220%">
              <feGaussianBlur stdDeviation="8" result="softBlur" />
              <feGaussianBlur stdDeviation="22" result="intenseGlow" />
              <feMerge>
                <feMergeNode in="intenseGlow" />
                <feMergeNode in="softBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Radar Emitting Rings (From Nose Radome) -->
          <g id="bg-radar-waves" class="opacity-40">
            <circle cx="400" cy="110" r="45" fill="none" stroke="#00B4D8" stroke-width="0.8" stroke-dasharray="3 3" />
            <circle cx="400" cy="110" r="90" fill="none" stroke="#0A47FF" stroke-width="0.8" stroke-dasharray="4 4" />
            <circle cx="400" cy="110" r="140" fill="none" stroke="#0A47FF" stroke-width="0.6" stroke-dasharray="6 6" />
          </g>

          <!-- Twin Afterburner Exhaust Jets (Ignites on Scroll) -->
          <g id="bg-afterburner-group" filter="url(#afterburnerGlow)">
            <!-- Left Engine Exhaust Plume -->
            <ellipse id="burn-core-left" cx="370" cy="800" rx="16" ry="110" fill="url(#reheatCoreGrad)" opacity="0.35" />
            <polygon id="burn-plume-left" points="356,760 384,760 395,940 345,940" fill="url(#reheatCoreGrad)" opacity="0.25" />

            <!-- Right Engine Exhaust Plume -->
            <ellipse id="burn-core-right" cx="430" cy="800" rx="16" ry="110" fill="url(#reheatCoreGrad)" opacity="0.35" />
            <polygon id="burn-plume-right" points="416,760 444,760 455,940 405,940" fill="url(#reheatCoreGrad)" opacity="0.25" />

            <!-- Supersonic Mach Shock Diamonds -->
            <g id="mach-diamonds" class="opacity-50">
              <polygon points="370,810 376,825 370,840 364,825" fill="#E0F2FE" />
              <polygon points="370,855 375,868 370,880 365,868" fill="#E0F2FE" />
              <polygon points="430,810 436,825 430,840 424,825" fill="#E0F2FE" />
              <polygon points="430,855 435,868 430,880 425,868" fill="#E0F2FE" />
            </g>
          </g>

          <!-- FIGHTER AIRCRAFT CAD BLUEPRINT SILHOUETTE -->
          <g id="bg-fighter-airframe" filter="url(#neonBlueGlow)">
            <!-- Outer Delta Wings & Leading-Edge Root Extensions (LERX) -->
            <path id="bg-airframe-wings" d="
              M 400,105
              Q 412,240 435,320
              L 520,380
              L 730,620
              L 720,650
              L 540,655
              L 470,750
              L 448,750
              L 445,710
              L 400,725
              L 355,710
              L 352,750
              L 330,750
              L 260,655
              L 80,650
              L 70,620
              L 280,380
              L 365,320
              Q 388,240 400,105 Z"
              fill="url(#bgFuselageGrad)"
              stroke="#0A47FF"
              stroke-width="1.8"
              class="transition-colors duration-500"
            />

            <!-- All-Moving Canard Foreplanes -->
            <polygon points="360,260 250,310 350,335" fill="rgba(10,71,255,0.2)" stroke="#38BDF8" stroke-width="1.2" />
            <polygon points="440,260 550,310 450,335" fill="rgba(10,71,255,0.2)" stroke="#38BDF8" stroke-width="1.2" />

            <!-- Wingtip Missile Launch Rails / Sensor Pods -->
            <rect x="66" y="605" width="8" height="60" rx="3" fill="#0F172A" stroke="#FF5722" stroke-width="1.2" />
            <rect x="726" y="605" width="8" height="60" rx="3" fill="#0F172A" stroke="#FF5722" stroke-width="1.2" />

            <!-- Navigation Strobe Lights -->
            <circle cx="70" cy="610" r="3.5" fill="#EF4444" class="strobe-port" />
            <circle cx="730" cy="610" r="3.5" fill="#10B981" class="strobe-starboard" />

            <!-- Wing Ribs & Structural Grid Lines -->
            <g stroke="#38BDF8" stroke-width="0.8" opacity="0.45" stroke-dasharray="6 3">
              <!-- Left Wing Structural Ribs -->
              <line x1="330" y1="420" x2="650" y2="620" />
              <line x1="345" y1="480" x2="610" y2="640" />
              <line x1="360" y1="540" x2="570" y2="648" />
              <!-- Right Wing Structural Ribs -->
              <line x1="470" y1="420" x2="150" y2="620" />
              <line x1="455" y1="480" x2="190" y2="640" />
              <line x1="440" y1="540" x2="230" y2="648" />
            </g>

            <!-- Elevons & Flaperons Trailing Edge Control Surfaces -->
            <polygon points="260,650 100,646 110,630 260,635" fill="none" stroke="#FF5722" stroke-width="1.2" opacity="0.7" />
            <polygon points="540,650 700,646 690,630 540,635" fill="none" stroke="#FF5722" stroke-width="1.2" opacity="0.7" />

            <!-- Central Fuselage Spine & Cockpit Radome -->
            <path d="
              M 400,95
              C 410,130 420,240 422,380
              C 424,520 420,680 415,730
              L 385,730
              C 380,680 376,520 378,380
              C 380,240 390,130 400,95 Z"
              fill="#0F172A"
              stroke="#00B4D8"
              stroke-width="1.6"
            />

            <!-- Pressurized Cockpit Canopy (Tinted HUD Glass) -->
            <ellipse cx="400" cy="245" rx="14" ry="58" fill="rgba(0, 180, 216, 0.35)" stroke="#38BDF8" stroke-width="1.5" />
            <line x1="400" y1="190" x2="400" y2="300" stroke="#FFFFFF" stroke-width="0.8" opacity="0.7" />

            <!-- Twin Engine Turbofan Titanium Nozzle Casings -->
            <rect x="352" y="738" width="34" height="22" rx="4" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
            <rect x="414" y="738" width="34" height="22" rx="4" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />

            <!-- HUD Radar Laser Scanning Bar (Sweeps Vertically) -->
            <rect id="bg-radar-sweep-bar" x="200" y="200" width="400" height="4" fill="url(#radarSweepGrad)" opacity="0.6" />
          </g>
        </svg>
      </div>
    `;

    document.body.prepend(container);

    // 2. Elements Cache
    const stageEl = document.getElementById('bg-fighter-stage');
    const burnCoreLeft = document.getElementById('burn-core-left');
    const burnCoreRight = document.getElementById('burn-core-right');
    const burnPlumeLeft = document.getElementById('burn-plume-left');
    const burnPlumeRight = document.getElementById('burn-plume-right');
    const machDiamonds = document.getElementById('mach-diamonds');
    const radarBar = document.getElementById('bg-radar-sweep-bar');
    const wingsPath = document.getElementById('bg-airframe-wings');
    
    // HUD Telemetry Elements
    const hudAlt = document.getElementById('hud-val-alt');
    const hudMach = document.getElementById('hud-val-mach');
    const hudThrust = document.getElementById('hud-val-thrust');
    const hudMeter = document.getElementById('hud-meter-fill');

    // 3. Scroll Tracking & Animation Engine
    let scrollFraction = 0;
    let targetScrollFraction = 0;
    let ticking = false;

    function updateScrollFraction() {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScrollFraction = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

      if (!ticking) {
        requestAnimationFrame(renderScrollFrame);
        ticking = true;
      }
    }

    window.addEventListener('scroll', updateScrollFraction, { passive: true });
    window.addEventListener('resize', updateScrollFraction, { passive: true });

    // Initial trigger
    updateScrollFraction();

    // 4. Smooth Render Frame
    let sweepPos = 200;
    let sweepDirection = 1;

    function renderScrollFrame() {
      // Smooth interpolation for silky response
      scrollFraction += (targetScrollFraction - scrollFraction) * 0.12;

      // Parallax 3D Perspective Pitch & Climb
      // As user scrolls down, aircraft climbs: pitches up slightly and scales smoothly
      const pitchDeg = -4 + scrollFraction * 12; // -4deg (level dive) -> +8deg (supersonic climb)
      const translateY = scrollFraction * -60;   // Climbs upward 60px
      const scale = 0.94 + scrollFraction * 0.12; // Scales up to 1.06

      if (stageEl) {
        stageEl.style.transform = `perspective(1200px) rotateX(${pitchDeg.toFixed(2)}deg) translateY(${translateY.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      }

      // Afterburner Reheat Expansion
      // 0% scroll -> Idle glow (soft amber/blue, length 90px)
      // 100% scroll -> Full Reheat (Mach-2 flare, length 240px, bright cyan-orange)
      const afterburnerScaleY = 0.6 + scrollFraction * 1.8;
      const afterburnerOpacity = 0.3 + scrollFraction * 0.65;
      const coreRx = 14 + scrollFraction * 10;
      const coreRy = 80 + scrollFraction * 90;

      if (burnCoreLeft && burnCoreRight) {
        burnCoreLeft.setAttribute('ry', coreRy.toFixed(1));
        burnCoreLeft.setAttribute('rx', coreRx.toFixed(1));
        burnCoreLeft.setAttribute('opacity', afterburnerOpacity.toFixed(2));

        burnCoreRight.setAttribute('ry', coreRy.toFixed(1));
        burnCoreRight.setAttribute('rx', coreRx.toFixed(1));
        burnCoreRight.setAttribute('opacity', afterburnerOpacity.toFixed(2));
      }

      if (burnPlumeLeft && burnPlumeRight) {
        const plumeScale = (1 + scrollFraction * 0.7).toFixed(2);
        burnPlumeLeft.style.transformOrigin = '370px 760px';
        burnPlumeLeft.style.transform = `scaleY(${afterburnerScaleY.toFixed(2)}) scaleX(${plumeScale})`;
        burnPlumeLeft.setAttribute('opacity', (afterburnerOpacity * 0.9).toFixed(2));

        burnPlumeRight.style.transformOrigin = '430px 760px';
        burnPlumeRight.style.transform = `scaleY(${afterburnerScaleY.toFixed(2)}) scaleX(${plumeScale})`;
        burnPlumeRight.setAttribute('opacity', (afterburnerOpacity * 0.9).toFixed(2));
      }

      if (machDiamonds) {
        machDiamonds.style.opacity = (0.2 + scrollFraction * 0.8).toFixed(2);
      }

      // Radar Sweep Bar Animation
      sweepPos += 2.5 * sweepDirection;
      if (sweepPos > 680) sweepDirection = -1;
      if (sweepPos < 140) sweepDirection = 1;
      if (radarBar) {
        radarBar.setAttribute('y', sweepPos.toFixed(1));
        radarBar.setAttribute('opacity', (0.3 + scrollFraction * 0.4).toFixed(2));
      }

      // Dynamic Airframe Color Saturation on Deep Scroll
      if (wingsPath) {
        if (scrollFraction > 0.75) {
          wingsPath.setAttribute('stroke', '#FF5722');
        } else {
          wingsPath.setAttribute('stroke', '#0A47FF');
        }
      }

      // Update HUD Telemetry Readouts
      if (hudAlt) {
        const currentAlt = Math.round(12400 + scrollFraction * 36200);
        hudAlt.textContent = `${currentAlt.toLocaleString()} FT`;
      }
      if (hudMach) {
        const currentMach = (0.85 + scrollFraction * 1.35).toFixed(2);
        hudMach.textContent = `MACH ${currentMach}`;
      }
      if (hudThrust && hudMeter) {
        const currentThrust = Math.round(25 + scrollFraction * 75);
        hudThrust.textContent = `${currentThrust}%`;
        hudMeter.style.width = `${currentThrust}%`;
      }

      // Continue frame if animating or if target not yet reached
      if (Math.abs(targetScrollFraction - scrollFraction) > 0.001) {
        requestAnimationFrame(renderScrollFrame);
      } else {
        ticking = false;
      }
    }
  }
})();
