/**
 * AeroBMSCE // Interactive 3D Aircraft Visualizer Engine
 * 
 * High-performance WebGL parametric supersonic delta-wing UAV:
 * - High-contrast Aerospace Livery: Deep Carbon Titanium, Cobalt Blue & Safety Orange
 * - Luminous Cyan HUD Cockpit Canopy with internal instrument glow
 * - Full 360° Mouse & Touch Drag Rotation with physics damping & auto-patrol
 * - Actuated dynamic elevons, pulsing afterburner flame, port/starboard nav lights
 * - Interactive Hotspot focus & smooth 3D camera transitions
 * - Instant CAD Wireframe / Solid composite livery toggle
 * - Live pitch, roll, yaw telemetry readouts
 */

(function () {
  'use strict';

  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  const container = document.getElementById('hero-three-canvas-container');
  if (!container) return;

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-100 rounded-xl">
        <img src="./images/cad-plane.png" alt="AeroBMSCE Aircraft CAD" class="max-h-64 object-contain mb-4">
        <p class="font-sans text-xs text-slate-600 font-semibold">3D Hardware Acceleration required for real-time WebGL inspection.</p>
      </div>
    `;
    return;
  }

  // Scene globals
  let scene, camera, renderer, aircraftGroup;
  let solidGroup, wireframeGroup;
  let leftElevonMesh, rightElevonMesh, leftElevonWire, rightElevonWire;
  let afterburnerFlame, navLightRed, navLightGreen, strobeWhite;
  let isWireframeActive = false;

  // Camera & Transform targets
  let targetRot = { x: 0.25, y: -0.65, z: 0.0 };
  let currentRot = { x: 0.25, y: -0.65, z: 0.0 };
  let targetCamPos = { x: 0, y: 0.2, z: 5.4 };
  let currentCamPos = { x: 0, y: 0.2, z: 5.4 };

  // Free Drag Rotation state
  let isDragging = false;
  let previousMousePos = { x: 0, y: 0 };
  let autoOrbit = true;
  let autoOrbitTimer = null;

  // Component focus positions
  const PART_PRESETS = [
    {
      name: 'Pixhawk 6X Autonomous Avionics',
      desc: 'Dual Here3+ RTK GNSS, pitot-static dynamic pressure tube, and companion computer running ROS & Edge-AI vision for precision target drop & autonomous waypoint navigation.',
      cam: { x: 0, y: 0.4, z: 3.2 },
      rot: { x: 0.15, y: 0.0, z: 0.0 }
    },
    {
      name: 'High-Lift Delta Wings & Dual Elevons',
      desc: 'Reflexed camber Selig 1223 airfoil section with active actuated carbon elevons delivering 420°/sec roll rate and maximum aerodynamic lift during high-G turns.',
      cam: { x: -0.8, y: 0.5, z: 3.4 },
      rot: { x: 0.35, y: -0.7, z: -0.15 }
    },
    {
      name: 'High-Efficiency Brushless Motor & ESC',
      desc: 'Sunnysky 4120 400KV pusher motor with custom aluminum heat-sink ESC, carbon fiber propeller, and 6S 70C LiPo battery delivering 4.2kg static thrust.',
      cam: { x: 0.6, y: 0.3, z: 3.2 },
      rot: { x: 0.1, y: 2.8, z: 0.0 }
    },
    {
      name: '3K Carbon-Fiber Monocoque Airframe',
      desc: 'Vacuum-bagged prepreg carbon fiber chassis with internal balsa ribs and modular payload bay tested to +9G acceleration load factor.',
      cam: { x: 0, y: 0.6, z: 3.8 },
      rot: { x: 0.45, y: 0.5, z: 0.1 }
    }
  ];

  init();
  animate();

  function init() {
    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;
    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(currentCamPos.x, currentCamPos.y, currentCamPos.z);

    // 3. Renderer with high dynamic range tone mapping
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting System (High contrast so it pops brilliantly!)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.3);
    scene.add(ambientLight);

    // Key Sun Light
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.0);
    sunLight.position.set(6, 10, 8);
    scene.add(sunLight);

    // Cobalt Aerospace Fill Light
    const cobaltLight = new THREE.DirectionalLight(0x0A47FF, 2.2);
    cobaltLight.position.set(-8, -4, -4);
    scene.add(cobaltLight);

    // Safety Orange Rim Light
    const orangeLight = new THREE.DirectionalLight(0xFF5722, 1.8);
    orangeLight.position.set(4, -6, -6);
    scene.add(orangeLight);

    // 5. Aircraft Root Group
    aircraftGroup = new THREE.Group();
    scene.add(aircraftGroup);

    solidGroup = new THREE.Group();
    wireframeGroup = new THREE.Group();
    aircraftGroup.add(solidGroup);
    aircraftGroup.add(wireframeGroup);
    wireframeGroup.visible = false;

    buildAircraftModel();

    // 6. Interactive Drag & Touch Controls
    setupEventListeners();
  }

  function buildAircraftModel() {
    // --- HIGH-CONTRAST AEROSPACE MATERIALS ---
    // 1. Carbon Titanium Fuselage (Dark stealth metallic)
    const carbonTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.28,
      metalness: 0.75,
      flatShading: true
    });

    // 2. Pure Composite White Radome & Dorsal Spine
    const whiteCompositeMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.2,
      metalness: 0.3,
      flatShading: true
    });

    // 3. Royal Cobalt Blue Wing Panels
    const cobaltMat = new THREE.MeshStandardMaterial({
      color: 0x0A47FF,
      roughness: 0.22,
      metalness: 0.5,
      flatShading: true
    });

    // 4. Safety Orange Control Surfaces
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xFF5722,
      roughness: 0.25,
      metalness: 0.4,
      flatShading: true
    });

    // 5. Radiant HUD Cyan Cockpit Glass
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x00F0FF,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
      flatShading: true
    });

    // 6. Glowing Technical CAD Line Materials
    const lineCobalt = new THREE.LineBasicMaterial({ color: 0x0A47FF, linewidth: 2 });
    const lineOrange = new THREE.LineBasicMaterial({ color: 0xFF5722, linewidth: 2 });
    const lineCyan = new THREE.LineBasicMaterial({ color: 0x00F0FF, linewidth: 2 });

    // --- A. Fuselage (Aerodynamic Chined Body) ---
    const fuselageGeom = new THREE.ConeGeometry(0.48, 4.2, 7);
    fuselageGeom.rotateX(Math.PI / 2);
    fuselageGeom.scale(1.0, 0.45, 1.0);

    const fuselageSolid = new THREE.Mesh(fuselageGeom, carbonTitaniumMat);
    fuselageSolid.position.z = -0.2;
    solidGroup.add(fuselageSolid);

    const fuselageWire = new THREE.LineSegments(new THREE.WireframeGeometry(fuselageGeom), lineCobalt);
    fuselageWire.position.z = -0.2;
    wireframeGroup.add(fuselageWire);

    // Dorsal Racing Stripe & Radome (White & Cobalt)
    const radomeGeom = new THREE.ConeGeometry(0.3, 1.2, 7);
    radomeGeom.rotateX(Math.PI / 2);
    radomeGeom.scale(1.0, 0.45, 1.0);
    const radomeSolid = new THREE.Mesh(radomeGeom, whiteCompositeMat);
    radomeSolid.position.z = 1.35;
    solidGroup.add(radomeSolid);

    const spineGeom = new THREE.BoxGeometry(0.14, 0.08, 2.6);
    const spineMesh = new THREE.Mesh(spineGeom, cobaltMat);
    spineMesh.position.set(0, 0.16, -0.2);
    solidGroup.add(spineMesh);

    // --- B. Cockpit Canopy with Inner HUD Glow ---
    const canopyGeom = new THREE.ConeGeometry(0.24, 1.5, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.scale(0.85, 0.45, 1.0);

    const canopySolid = new THREE.Mesh(canopyGeom, canopyMat);
    canopySolid.position.set(0, 0.22, 0.5);
    solidGroup.add(canopySolid);

    const canopyWire = new THREE.LineSegments(new THREE.WireframeGeometry(canopyGeom), lineCyan);
    canopyWire.position.set(0, 0.22, 0.5);
    wireframeGroup.add(canopyWire);

    const hudLight = new THREE.PointLight(0x00F0FF, 1.5, 2.0);
    hudLight.position.set(0, 0.2, 0.5);
    solidGroup.add(hudLight);

    // --- C. Main Swept Delta Wing ---
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.2);        // Nose apex
    wingShape.lineTo(2.45, -0.85);   // Starboard wingtip
    wingShape.lineTo(2.4, -1.05);    // Wingtip trailing
    wingShape.lineTo(0.55, -1.0);    // Inboard elevon cut
    wingShape.lineTo(0, -1.1);       // Center root
    wingShape.lineTo(-0.55, -1.0);
    wingShape.lineTo(-2.4, -1.05);
    wingShape.lineTo(-2.45, -0.85);  // Port wingtip
    wingShape.closePath();

    const wingGeom = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.03
    });
    wingGeom.rotateX(Math.PI / 2);

    const wingSolid = new THREE.Mesh(wingGeom, cobaltMat);
    solidGroup.add(wingSolid);

    const wingWire = new THREE.LineSegments(new THREE.WireframeGeometry(wingGeom), lineCobalt);
    wireframeGroup.add(wingWire);

    // Wing Leading Edge Strake Accents (Carbon Titanium)
    [-1, 1].forEach((dir) => {
      const strakeGeom = new THREE.BoxGeometry(0.12, 0.07, 2.5);
      strakeGeom.rotateY(dir * 0.45);
      const strakeMesh = new THREE.Mesh(strakeGeom, carbonTitaniumMat);
      strakeMesh.position.set(dir * 1.22, 0.02, 0.05);
      solidGroup.add(strakeMesh);
    });

    // --- D. Actuated Elevons (Safety Orange) ---
    const elevonShape = new THREE.Shape();
    elevonShape.moveTo(0, 0);
    elevonShape.lineTo(1.75, 0);
    elevonShape.lineTo(1.7, -0.28);
    elevonShape.lineTo(0, -0.25);
    elevonShape.closePath();

    const elevonGeom = new THREE.ExtrudeGeometry(elevonShape, { depth: 0.04, bevelEnabled: false });

    // Right Elevon
    rightElevonMesh = new THREE.Mesh(elevonGeom, orangeMat);
    rightElevonMesh.position.set(0.6, 0.02, -1.05);
    rightElevonMesh.rotation.x = Math.PI / 2;
    solidGroup.add(rightElevonMesh);

    rightElevonWire = new THREE.LineSegments(new THREE.WireframeGeometry(elevonGeom), lineOrange);
    rightElevonWire.position.copy(rightElevonMesh.position);
    rightElevonWire.rotation.copy(rightElevonMesh.rotation);
    wireframeGroup.add(rightElevonWire);

    // Left Elevon
    leftElevonMesh = new THREE.Mesh(elevonGeom, orangeMat);
    leftElevonMesh.scale.x = -1;
    leftElevonMesh.position.set(-0.6, 0.02, -1.05);
    leftElevonMesh.rotation.x = Math.PI / 2;
    solidGroup.add(leftElevonMesh);

    leftElevonWire = new THREE.LineSegments(new THREE.WireframeGeometry(elevonGeom), lineOrange);
    leftElevonWire.scale.x = -1;
    leftElevonWire.position.copy(leftElevonMesh.position);
    leftElevonWire.rotation.copy(leftElevonMesh.rotation);
    wireframeGroup.add(leftElevonWire);

    // --- E. Forward Canards ---
    const canardShape = new THREE.Shape();
    canardShape.moveTo(0, 0.35);
    canardShape.lineTo(0.75, 0.05);
    canardShape.lineTo(0.7, -0.15);
    canardShape.lineTo(0, -0.05);
    canardShape.lineTo(-0.7, -0.15);
    canardShape.lineTo(-0.75, 0.05);
    canardShape.closePath();

    const canardGeom = new THREE.ExtrudeGeometry(canardShape, { depth: 0.025, bevelEnabled: false });
    canardGeom.rotateX(Math.PI / 2);
    canardGeom.translate(0, 0.05, 0.9);

    const canardSolid = new THREE.Mesh(canardGeom, orangeMat);
    solidGroup.add(canardSolid);

    const canardWire = new THREE.LineSegments(new THREE.WireframeGeometry(canardGeom), lineOrange);
    wireframeGroup.add(canardWire);

    // --- F. Twin Canted Tail Fins ---
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.35, 0.72);
    finShape.lineTo(0.1, 0.72);
    finShape.lineTo(-0.24, 0);
    finShape.closePath();

    const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.035, bevelEnabled: false });

    // Left Fin
    const leftFin = new THREE.Mesh(finGeom, carbonTitaniumMat);
    leftFin.position.set(-0.48, 0.05, -1.05);
    leftFin.rotation.z = 0.28;
    solidGroup.add(leftFin);

    const leftFinWire = new THREE.LineSegments(new THREE.WireframeGeometry(finGeom), lineCobalt);
    leftFinWire.position.copy(leftFin.position);
    leftFinWire.rotation.copy(leftFin.rotation);
    wireframeGroup.add(leftFinWire);

    // Right Fin
    const rightFin = new THREE.Mesh(finGeom, carbonTitaniumMat);
    rightFin.scale.x = -1;
    rightFin.position.set(0.48, 0.05, -1.05);
    rightFin.rotation.z = -0.28;
    solidGroup.add(rightFin);

    const rightFinWire = new THREE.LineSegments(new THREE.WireframeGeometry(finGeom), lineCobalt);
    rightFinWire.scale.x = -1;
    rightFinWire.position.copy(rightFin.position);
    rightFinWire.rotation.copy(rightFin.rotation);
    wireframeGroup.add(rightFinWire);

    // --- G. Navigation Lights ---
    const navGeom = new THREE.SphereGeometry(0.045, 8, 8);

    navLightRed = new THREE.Mesh(navGeom, new THREE.MeshBasicMaterial({ color: 0xFF2200 }));
    navLightRed.position.set(-2.44, 0.02, -0.95);
    aircraftGroup.add(navLightRed);

    navLightGreen = new THREE.Mesh(navGeom, new THREE.MeshBasicMaterial({ color: 0x00FF66 }));
    navLightGreen.position.set(2.44, 0.02, -0.95);
    aircraftGroup.add(navLightGreen);

    strobeWhite = new THREE.Mesh(navGeom, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    strobeWhite.position.set(0, 0.28, -1.05);
    aircraftGroup.add(strobeWhite);

    // --- H. Afterburner & Pusher Prop Nozzle ---
    const nozzleGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.38, 12);
    nozzleGeom.rotateX(Math.PI / 2);
    const nozzleMesh = new THREE.Mesh(nozzleGeom, carbonTitaniumMat);
    nozzleMesh.position.set(0, 0.02, -1.85);
    solidGroup.add(nozzleMesh);

    const flameGeom = new THREE.ConeGeometry(0.18, 1.1, 8);
    flameGeom.rotateX(-Math.PI / 2);
    afterburnerFlame = new THREE.Mesh(flameGeom, new THREE.MeshBasicMaterial({
      color: 0xFF5722,
      transparent: true,
      opacity: 0.85,
      wireframe: true
    }));
    afterburnerFlame.position.set(0, 0.02, -2.45);
    aircraftGroup.add(afterburnerFlame);
  }

  function setupEventListeners() {
    const canvas = renderer.domElement;

    // Mouse Drag Rotation
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      autoOrbit = false;
      if (autoOrbitTimer) clearTimeout(autoOrbitTimer);
      previousMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePos.x;
      const deltaY = e.clientY - previousMousePos.y;

      targetRot.y += deltaX * 0.009;
      targetRot.x += deltaY * 0.009;

      previousMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        autoOrbitTimer = setTimeout(() => { autoOrbit = true; }, 3500);
      }
    });

    // Touch Support
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        isDragging = true;
        autoOrbit = false;
        if (autoOrbitTimer) clearTimeout(autoOrbitTimer);
        previousMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - previousMousePos.x;
      const deltaY = e.touches[0].clientY - previousMousePos.y;

      targetRot.y += deltaX * 0.009;
      targetRot.x += deltaY * 0.009;

      previousMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        autoOrbitTimer = setTimeout(() => { autoOrbit = true; }, 3500);
      }
    }, { passive: true });

    // Mouse Wheel Zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetCamPos.z = Math.min(Math.max(targetCamPos.z + e.deltaY * 0.005, 2.4), 8.0);
    }, { passive: false });

    // Window Resize & Container ResizeObserver
    window.addEventListener('resize', onResize, false);
    window.addEventListener('load', onResize, false);

    if (window.ResizeObserver && container) {
      const ro = new ResizeObserver(() => {
        onResize();
      });
      ro.observe(container);
    }

    // CAD Wireframe Toggle Button
    const wireframeBtn = document.getElementById('btn-toggle-wireframe');
    const wireframeText = document.getElementById('wireframe-btn-text');
    if (wireframeBtn) {
      wireframeBtn.addEventListener('click', () => {
        isWireframeActive = !isWireframeActive;
        wireframeGroup.visible = isWireframeActive;
        solidGroup.visible = !isWireframeActive;
        if (wireframeText) {
          wireframeText.textContent = isWireframeActive ? 'Solid Livery' : 'CAD Wireframe';
        }
      });
    }

    // Reset View Button
    const resetBtn = document.getElementById('btn-reset-orientation');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        targetRot = { x: 0.25, y: -0.65, z: 0.0 };
        targetCamPos = { x: 0, y: 0.2, z: 5.4 };
        autoOrbit = true;
      });
    }

    // Trigger initial layout calculation
    setTimeout(onResize, 50);
    setTimeout(onResize, 300);
  }

  function onResize() {
    if (!renderer || !camera || !container) return;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  let clock = new THREE.Clock();
  const telemRoll = document.getElementById('telem-roll');
  const telemPitch = document.getElementById('telem-pitch');

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Gentle Auto Orbit / Patrol when not manually dragged
    if (autoOrbit && !isDragging) {
      targetRot.y += delta * 0.25;
      targetRot.x = Math.sin(time * 0.8) * 0.12 + 0.22;
      targetRot.z = Math.cos(time * 0.8) * 0.08;
    }

    // Exponential Lerp for Camera and Rotation
    const lerpSpeed = 0.06;
    currentRot.x += (targetRot.x - currentRot.x) * lerpSpeed;
    currentRot.y += (targetRot.y - currentRot.y) * lerpSpeed;
    currentRot.z += (targetRot.z - currentRot.z) * lerpSpeed;

    currentCamPos.x += (targetCamPos.x - currentCamPos.x) * lerpSpeed;
    currentCamPos.y += (targetCamPos.y - currentCamPos.y) * lerpSpeed;
    currentCamPos.z += (targetCamPos.z - currentCamPos.z) * lerpSpeed;

    camera.position.set(currentCamPos.x, currentCamPos.y, currentCamPos.z);
    camera.lookAt(0, 0, 0);

    // Hover Turbulence
    const hoverY = Math.sin(time * 2.2) * 0.04;
    aircraftGroup.position.set(0, hoverY, 0);
    aircraftGroup.rotation.set(currentRot.x, currentRot.y, currentRot.z);

    // Deflect Elevons dynamically
    if (leftElevonMesh && rightElevonMesh) {
      const pitchDeflect = Math.sin(time * 1.6) * 0.22;
      const rollDeflect = Math.cos(time * 1.6) * 0.22;

      leftElevonMesh.rotation.x = (Math.PI / 2) + pitchDeflect + rollDeflect;
      rightElevonMesh.rotation.x = (Math.PI / 2) + pitchDeflect - rollDeflect;

      if (leftElevonWire) leftElevonWire.rotation.x = leftElevonMesh.rotation.x;
      if (rightElevonWire) rightElevonWire.rotation.x = rightElevonMesh.rotation.x;
    }

    // Afterburner Thrust Pulse
    if (afterburnerFlame) {
      const pulse = 1.0 + Math.sin(time * 16) * 0.18;
      afterburnerFlame.scale.set(pulse, pulse, pulse * 1.2);
    }

    // Strobe navigation light
    if (strobeWhite) {
      strobeWhite.visible = Math.sin(time * 10) > 0.85;
    }

    // Update Telemetry Readout
    if (telemPitch && telemRoll) {
      const pitchDeg = (currentRot.x * (180 / Math.PI)).toFixed(1);
      const rollDeg = (currentRot.z * (180 / Math.PI)).toFixed(1);
      telemPitch.textContent = `${pitchDeg > 0 ? '+' : ''}${pitchDeg}°`;
      telemRoll.textContent = `${rollDeg > 0 ? '+' : ''}${rollDeg}°`;
    }

    renderer.render(scene, camera);
  }

  // Component Focus function exposed globally
  function focusOnPart(partIndex) {
    if (partIndex < 0 || partIndex >= PART_PRESETS.length) return;
    const part = PART_PRESETS[partIndex];

    targetCamPos = { x: part.cam.x, y: part.cam.y, z: part.cam.z };
    targetRot = { x: part.rot.x, y: part.rot.y, z: part.rot.z };
    autoOrbit = false;

    // Show Part Modal
    const modalTitle = document.getElementById('part-modal-title');
    const modalDesc = document.getElementById('part-modal-desc');
    const modal = document.getElementById('part-detail-modal');

    if (modalTitle) modalTitle.textContent = part.name;
    if (modalDesc) modalDesc.textContent = part.desc;
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  // Export to window
  window.AeroBMSCE_Aircraft = {
    focusOnPart: focusOnPart,
    resetView: () => {
      targetRot = { x: 0.25, y: -0.65, z: 0.0 };
      targetCamPos = { x: 0, y: 0.2, z: 5.4 };
      autoOrbit = true;
    }
  };
})();
