/**
 * AeroBMSCE // High-Fidelity 3D Interactive Aircraft Visualizer Engine
 * 
 * Detailed Parametric Competition UAV (VAYU-01):
 * - Nose pitot tube & radome
 * - Transparent cockpit canopy with visible internal Pixhawk avionics & HUD glow
 * - Reflexed camber high-lift delta wing with wingtip fence winglets & vortex strakes
 * - Actuated elevons with servo pushrods
 * - Rapidly spinning rear carbon propeller & brushless outrunner motor
 * - FPV cloverleaf & 915MHz telemetry antennas
 * - Carbon fiber belly landing skids
 * - 360° mouse / touch drag rotation with inertia & wheel zoom
 * - Interactive in-stage pop-up card on touch/click with technical specs
 * - CAD Wireframe toggle & live pitch/roll telemetry
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
        <p class="font-sans text-xs text-slate-600 font-semibold">WebGL hardware acceleration required for 3D flight engine.</p>
      </div>
    `;
    return;
  }

  // Scene & System Globals
  let scene, camera, renderer, aircraftGroup;
  let solidGroup, wireframeGroup;
  let leftElevonMesh, rightElevonMesh, leftElevonWire, rightElevonWire;
  let leftPushrod, rightPushrod;
  let propellerGroup;
  let navLightRed, navLightGreen, strobeWhite;
  let isWireframeActive = false;
  let isCanvasVisible = true;

  // Clock & Telemetry Globals
  let clock = new THREE.Clock();
  let telemRoll = null;
  let telemPitch = null;

  // Camera & Transform Targets (Scaled & positioned so the ENTIRE plane fits with breathing room!)
  const DEFAULT_CAM = { x: 0, y: 0.35, z: 7.2 };
  const DEFAULT_ROT = { x: 0.28, y: -0.65, z: 0.0 };
  let targetRot = { ...DEFAULT_ROT };
  let currentRot = { ...DEFAULT_ROT };
  let targetCamPos = { ...DEFAULT_CAM };
  let currentCamPos = { ...DEFAULT_CAM };

  // Free Drag Rotation State
  let isDragging = false;
  let previousMousePos = { x: 0, y: 0 };
  let autoOrbit = true;
  let autoOrbitTimer = null;

  // Component Technical Specifications & Focus Presets
  const PART_PRESETS = [
    {
      name: 'Pixhawk 6X Autonomous Avionics',
      badge: 'FLIGHT CONTROL & NAVIGATION',
      desc: 'Dual Here3+ RTK GNSS, pitot-static dynamic pressure airspeed sensor, triple redundant IMUs, and companion companion computer running ROS 2 with Edge-AI computer vision for autonomous waypoint missions.',
      specs: [
        { label: 'Processor', val: 'STM32H753 480MHz' },
        { label: 'GNSS Accuracy', val: 'Dual RTK (<2cm)' },
        { label: 'Telemetry', val: '915MHz Microhard Link' },
        { label: 'Firmware', val: 'PX4 Pro / ArduPilot' }
      ],
      cam: { x: 0, y: 1.1, z: 4.8 },
      rot: { x: 0.35, y: 0.0, z: 0.0 }
    },
    {
      name: 'High-Lift Delta Wings & Actuated Elevons',
      badge: 'AERODYNAMICS & CONTROL SURFACES',
      desc: 'Selig 1223 reflexed camber delta airfoil section optimized for maximum coefficient of lift (Cl_max = 2.1) during high payload cargo flights with independent carbon fiber elevons and wingtip fence winglets.',
      specs: [
        { label: 'Airfoil Section', val: 'Selig S1223 Reflexed' },
        { label: 'Roll Rate', val: '420° / sec' },
        { label: 'Control Servos', val: 'Titanium-Gear Digital' },
        { label: 'Wingtips', val: 'Anti-Vortex Fence' }
      ],
      cam: { x: -1.4, y: 1.0, z: 5.2 },
      rot: { x: 0.45, y: -0.75, z: -0.15 }
    },
    {
      name: 'Brushless Propulsion & Pusher Propeller',
      badge: 'PROPULSION & POWER SYSTEM',
      desc: 'Sunnysky 4120 400KV outrunner brushless motor paired with a 14x7 carbon fiber pusher propeller and an 80A telemetry ESC, generating 4.2 kg static thrust with rapid throttle response.',
      specs: [
        { label: 'Motor KV', val: 'Sunnysky 4120 400KV' },
        { label: 'Static Thrust', val: '4.2 kg @ 22.2V' },
        { label: 'Propeller', val: '14x7 Carbon Pusher' },
        { label: 'Battery Pack', val: '6S 70C 5200mAh LiPo' }
      ],
      cam: { x: 0.8, y: 0.8, z: 5.0 },
      rot: { x: 0.2, y: 2.75, z: 0.0 }
    },
    {
      name: '3K Carbon-Fiber Monocoque Airframe',
      badge: 'STRUCTURAL FABRICATION',
      desc: 'Vacuum-bagged prepreg carbon fiber chassis with internal CNC-cut balsa formers and modular payload bay engineered to withstand +9G acceleration maneuvers.',
      specs: [
        { label: 'Material', val: '3K 200gsm Twill Carbon' },
        { label: 'Load Limit', val: '+9.0 G / -4.5 G' },
        { label: 'MTOW', val: '10.2 kg Max Weight' },
        { label: 'Payload Bay', val: 'Modular Quick-Release' }
      ],
      cam: { x: 0, y: 1.4, z: 5.5 },
      rot: { x: 0.6, y: 0.5, z: 0.1 }
    }
  ];

  init();
  animate();

  function init() {
    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (Balanced FOV & perspective so the whole plane is framed)
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;
    camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(currentCamPos.x, currentCamPos.y, currentCamPos.z);

    // 3. Renderer with ACES Tone Mapping
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting System
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
    sunLight.position.set(6, 12, 8);
    scene.add(sunLight);

    const cobaltLight = new THREE.DirectionalLight(0x0A47FF, 2.2);
    cobaltLight.position.set(-8, -4, -4);
    scene.add(cobaltLight);

    const orangeLight = new THREE.DirectionalLight(0xFF5722, 1.8);
    orangeLight.position.set(4, -6, -6);
    scene.add(orangeLight);

    // 5. Aircraft Root Group (Scaled to 0.85 for elegant fitting!)
    aircraftGroup = new THREE.Group();
    aircraftGroup.scale.set(0.85, 0.85, 0.85);
    scene.add(aircraftGroup);

    solidGroup = new THREE.Group();
    wireframeGroup = new THREE.Group();
    aircraftGroup.add(solidGroup);
    aircraftGroup.add(wireframeGroup);
    wireframeGroup.visible = false;

    // 6. Build the Complete Detailed Aircraft Model
    buildAircraftModel();

    // 7. Setup Interactive Controls & Event Listeners
    setupEventListeners();
  }

  function buildAircraftModel() {
    // --- HIGH-CONTRAST MATERIALS ---
    // Carbon Titanium Fuselage
    const carbonTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.28,
      metalness: 0.75,
      flatShading: true
    });

    // Pure Composite White Radome
    const whiteCompositeMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.2,
      metalness: 0.3,
      flatShading: true
    });

    // Royal Cobalt Blue Wings
    const cobaltMat = new THREE.MeshStandardMaterial({
      color: 0x0A47FF,
      roughness: 0.22,
      metalness: 0.5,
      flatShading: true
    });

    // Aerospace Safety Orange Control Surfaces
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xFF5722,
      roughness: 0.25,
      metalness: 0.4,
      flatShading: true
    });

    // Polished Silver Metallic for Hardware & Pushrods
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.15,
      metalness: 0.9
    });

    // Anodized Gold Motor Bell
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.2,
      metalness: 0.85
    });

    // Matte Black Carbon for Propeller Blades & Skids
    const carbonBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.35,
      metalness: 0.5
    });

    // Radiant HUD Cyan Cockpit Glass
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x00F0FF,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.82,
      flatShading: true
    });

    // Glowing CAD Lines
    const lineCobalt = new THREE.LineBasicMaterial({ color: 0x0A47FF, linewidth: 2 });
    const lineOrange = new THREE.LineBasicMaterial({ color: 0xFF5722, linewidth: 2 });
    const lineCyan = new THREE.LineBasicMaterial({ color: 0x00F0FF, linewidth: 2 });

    // =========================================================================
    // 1. FUSELAGE & NOSE RADOME
    // =========================================================================
    const fuselageGeom = new THREE.ConeGeometry(0.48, 4.0, 8);
    fuselageGeom.rotateX(Math.PI / 2);
    fuselageGeom.scale(1.0, 0.45, 1.0);

    const fuselageSolid = new THREE.Mesh(fuselageGeom, carbonTitaniumMat);
    fuselageSolid.position.z = -0.2;
    solidGroup.add(fuselageSolid);

    const fuselageWire = new THREE.LineSegments(new THREE.WireframeGeometry(fuselageGeom), lineCobalt);
    fuselageWire.position.z = -0.2;
    wireframeGroup.add(fuselageWire);

    // Nose Cone Radome (Pure White)
    const radomeGeom = new THREE.ConeGeometry(0.3, 1.15, 8);
    radomeGeom.rotateX(Math.PI / 2);
    radomeGeom.scale(1.0, 0.45, 1.0);
    const radomeSolid = new THREE.Mesh(radomeGeom, whiteCompositeMat);
    radomeSolid.position.z = 1.35;
    solidGroup.add(radomeSolid);

    // Pitot-Static Airspeed Probe (Silver needle at nose apex)
    const pitotGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6);
    pitotGeom.rotateX(Math.PI / 2);
    const pitotMesh = new THREE.Mesh(pitotGeom, silverMat);
    pitotMesh.position.set(0, 0.02, 2.2);
    solidGroup.add(pitotMesh);

    // Dorsal Spine (Cobalt Racing Stripe)
    const spineGeom = new THREE.BoxGeometry(0.14, 0.08, 2.5);
    const spineMesh = new THREE.Mesh(spineGeom, cobaltMat);
    spineMesh.position.set(0, 0.16, -0.2);
    solidGroup.add(spineMesh);

    // =========================================================================
    // 2. COCKPIT CANOPY & INTERNAL AVIONICS
    // =========================================================================
    const canopyGeom = new THREE.ConeGeometry(0.24, 1.45, 4);
    canopyGeom.rotateX(Math.PI / 2);
    canopyGeom.scale(0.85, 0.45, 1.0);

    const canopySolid = new THREE.Mesh(canopyGeom, canopyMat);
    canopySolid.position.set(0, 0.22, 0.5);
    solidGroup.add(canopySolid);

    const canopyWire = new THREE.LineSegments(new THREE.WireframeGeometry(canopyGeom), lineCyan);
    canopyWire.position.set(0, 0.22, 0.5);
    wireframeGroup.add(canopyWire);

    // Internal Pixhawk Cube (Visible inside tinted glass)
    const pixhawkGeom = new THREE.BoxGeometry(0.12, 0.08, 0.15);
    const pixhawkMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.2 });
    const pixhawkMesh = new THREE.Mesh(pixhawkGeom, pixhawkMat);
    pixhawkMesh.position.set(0, 0.15, 0.45);
    solidGroup.add(pixhawkMesh);

    // Internal HUD Pilot Light Glow
    const hudLight = new THREE.PointLight(0x00F0FF, 1.6, 2.0);
    hudLight.position.set(0, 0.22, 0.5);
    solidGroup.add(hudLight);

    // =========================================================================
    // 3. HIGH-LIFT SWEPT DELTA WINGS WITH WINGTIPS
    // =========================================================================
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.15);       // Nose blend apex
    wingShape.lineTo(2.4, -0.85);    // Starboard wingtip leading edge
    wingShape.lineTo(2.35, -1.05);   // Starboard trailing edge
    wingShape.lineTo(0.55, -1.0);    // Inboard elevon cut
    wingShape.lineTo(0, -1.1);       // Center trailing root
    wingShape.lineTo(-0.55, -1.0);   // Inboard elevon cut port
    wingShape.lineTo(-2.35, -1.05);
    wingShape.lineTo(-2.4, -0.85);   // Port wingtip leading edge
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

    // Wingtip Fence Winglets (Vertical fins at both wingtips in safety orange!)
    [-1, 1].forEach((dir) => {
      const wingletShape = new THREE.Shape();
      wingletShape.moveTo(0, 0);
      wingletShape.lineTo(0.2, 0.35);
      wingletShape.lineTo(0.05, 0.35);
      wingletShape.lineTo(-0.25, 0);
      wingletShape.closePath();

      const wingletGeom = new THREE.ExtrudeGeometry(wingletShape, { depth: 0.02, bevelEnabled: false });
      const wingletMesh = new THREE.Mesh(wingletGeom, orangeMat);
      wingletMesh.position.set(dir * 2.38, 0.02, -0.95);
      solidGroup.add(wingletMesh);
    });

    // Wing Leading Edge Vortex Strakes (Carbon Titanium)
    [-1, 1].forEach((dir) => {
      const strakeGeom = new THREE.BoxGeometry(0.12, 0.07, 2.4);
      strakeGeom.rotateY(dir * 0.45);
      const strakeMesh = new THREE.Mesh(strakeGeom, carbonTitaniumMat);
      strakeMesh.position.set(dir * 1.2, 0.02, 0.05);
      solidGroup.add(strakeMesh);
    });

    // =========================================================================
    // 4. ACTUATED ELEVONS & MECHANICAL PUSHROD LINKAGES
    // =========================================================================
    const elevonShape = new THREE.Shape();
    elevonShape.moveTo(0, 0);
    elevonShape.lineTo(1.7, 0);
    elevonShape.lineTo(1.65, -0.28);
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

    // Servo Pushrods (Silver linkages connecting wing servo to elevon horn)
    const pushrodGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.28);
    pushrodGeom.rotateX(Math.PI / 2);

    rightPushrod = new THREE.Mesh(pushrodGeom, silverMat);
    rightPushrod.position.set(1.4, 0.05, -0.98);
    solidGroup.add(rightPushrod);

    leftPushrod = new THREE.Mesh(pushrodGeom, silverMat);
    leftPushrod.position.set(-1.4, 0.05, -0.98);
    solidGroup.add(leftPushrod);

    // =========================================================================
    // 5. TWIN CANTED TAIL FINS
    // =========================================================================
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.32, 0.72);
    finShape.lineTo(0.08, 0.72);
    finShape.lineTo(-0.24, 0);
    finShape.closePath();

    const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.035, bevelEnabled: false });

    // Left Fin (Canted)
    const leftFin = new THREE.Mesh(finGeom, carbonTitaniumMat);
    leftFin.position.set(-0.48, 0.05, -1.05);
    leftFin.rotation.z = 0.28;
    solidGroup.add(leftFin);

    const leftFinWire = new THREE.LineSegments(new THREE.WireframeGeometry(finGeom), lineCobalt);
    leftFinWire.position.copy(leftFin.position);
    leftFinWire.rotation.copy(leftFin.rotation);
    wireframeGroup.add(leftFinWire);

    // Right Fin (Canted)
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

    // =========================================================================
    // 6. BRUSHLESS OUTRUNNER MOTOR & RAPIDLY SPINNING PROPELLER
    // =========================================================================
    // Motor Mount Standoff
    const mountGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 10);
    mountGeom.rotateX(Math.PI / 2);
    const mountMesh = new THREE.Mesh(mountGeom, carbonTitaniumMat);
    mountMesh.position.set(0, 0.02, -1.82);
    solidGroup.add(mountMesh);

    // Anodized Gold Outrunner Motor Bell
    const motorGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12);
    motorGeom.rotateX(Math.PI / 2);
    const motorMesh = new THREE.Mesh(motorGeom, goldMat);
    motorMesh.position.set(0, 0.02, -2.0);
    solidGroup.add(motorMesh);

    // Rotating Propeller Subgroup
    propellerGroup = new THREE.Group();
    propellerGroup.position.set(0, 0.02, -2.14);
    aircraftGroup.add(propellerGroup);

    // Propeller Hub (Silver Spinner)
    const hubGeom = new THREE.ConeGeometry(0.08, 0.22, 8);
    hubGeom.rotateX(-Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeom, silverMat);
    propellerGroup.add(hubMesh);

    // Propeller Blades (2 Carbon Fiber Twisted Aerodynamic Blades)
    [-1, 1].forEach((dir) => {
      const bladeGeom = new THREE.BoxGeometry(0.08, 0.95, 0.02);
      bladeGeom.rotateZ(dir * 0.15); // Pitch angle
      const bladeMesh = new THREE.Mesh(bladeGeom, carbonBlackMat);
      bladeMesh.position.set(0, dir * 0.52, 0.02);
      propellerGroup.add(bladeMesh);
    });

    // =========================================================================
    // 7. BELLY LANDING SKIDS & ANTENNAS
    // =========================================================================
    // Belly Landing Skids (Carbon)
    [-0.32, 0.32].forEach((xPos) => {
      const skidGeom = new THREE.BoxGeometry(0.04, 0.12, 1.8);
      const skidMesh = new THREE.Mesh(skidGeom, carbonBlackMat);
      skidMesh.position.set(xPos, -0.22, -0.1);
      solidGroup.add(skidMesh);
    });

    // 5.8GHz FPV Mushroom Antenna (Dorsal Spine)
    const antPoleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.22);
    const antPole = new THREE.Mesh(antPoleGeom, silverMat);
    antPole.position.set(0, 0.26, -0.6);
    solidGroup.add(antPole);

    const antDomeGeom = new THREE.SphereGeometry(0.065, 8, 8);
    const antDome = new THREE.Mesh(antDomeGeom, orangeMat);
    antDome.position.set(0, 0.38, -0.6);
    solidGroup.add(antDome);

    // =========================================================================
    // 8. NAVIGATION LIGHTS
    // =========================================================================
    const navGeom = new THREE.SphereGeometry(0.045, 8, 8);

    navLightRed = new THREE.Mesh(navGeom, new THREE.MeshBasicMaterial({ color: 0xFF2200 }));
    navLightRed.position.set(-2.4, 0.02, -0.95);
    aircraftGroup.add(navLightRed);

    navLightGreen = new THREE.Mesh(navGeom, new THREE.MeshBasicMaterial({ color: 0x00FF66 }));
    navLightGreen.position.set(2.4, 0.02, -0.95);
    aircraftGroup.add(navLightGreen);

    strobeWhite = new THREE.Mesh(navGeom, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    strobeWhite.position.set(0, 0.28, -1.05);
    aircraftGroup.add(strobeWhite);
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
        autoOrbitTimer = setTimeout(() => { autoOrbit = true; }, 4000);
      }
    });

    // Touch Support (for mobile/tablet touch)
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
        autoOrbitTimer = setTimeout(() => { autoOrbit = true; }, 4000);
      }
    }, { passive: true });

    // Mouse Wheel Zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetCamPos.z = Math.min(Math.max(targetCamPos.z + e.deltaY * 0.006, 3.2), 10.5);
    }, { passive: false });

    // Window Resize & Container ResizeObserver
    window.addEventListener('resize', onResize, false);
    window.addEventListener('load', onResize, false);

    if (typeof window !== 'undefined' && window.ResizeObserver && container) {
      try {
        const ro = new window.ResizeObserver(() => {
          onResize();
        });
        ro.observe(container);
      } catch (e) {}
    }

    // High Performance: Pause Three.js render engine when scrolled off-screen
    if (typeof window !== 'undefined' && window.IntersectionObserver && container) {
      try {
        const io = new window.IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isCanvasVisible = entry.isIntersecting;
            if (isCanvasVisible) {
              clock.getDelta(); // reset delta so no huge time jump
            }
          });
        }, { threshold: 0.05 });
        io.observe(container);
      } catch (e) {}
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
        resetView();
      });
    }

    // Close In-Stage Pop-Up Button
    const closePopupBtn = document.getElementById('close-stage-popup');
    if (closePopupBtn) {
      closePopupBtn.addEventListener('click', () => {
        closeStagePopup();
      });
    }

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

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    if (!isCanvasVisible) return;

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Rapidly Spin Propeller at ~3200 RPM equivalent
    if (propellerGroup) {
      propellerGroup.rotation.z += delta * 28.0;
    }

    // Gentle Auto Orbit / Patrol when not manually dragged
    if (autoOrbit && !isDragging) {
      targetRot.y += delta * 0.22;
      targetRot.x = Math.sin(time * 0.8) * 0.1 + 0.26;
      targetRot.z = Math.cos(time * 0.8) * 0.08;
    }

    // Smooth Exponential Lerp
    const lerpSpeed = 0.06;
    currentRot.x += (targetRot.x - currentRot.x) * lerpSpeed;
    currentRot.y += (targetRot.y - currentRot.y) * lerpSpeed;
    currentRot.z += (targetRot.z - currentRot.z) * lerpSpeed;

    currentCamPos.x += (targetCamPos.x - currentCamPos.x) * lerpSpeed;
    currentCamPos.y += (targetCamPos.y - currentCamPos.y) * lerpSpeed;
    currentCamPos.z += (targetCamPos.z - currentCamPos.z) * lerpSpeed;

    camera.position.set(currentCamPos.x, currentCamPos.y, currentCamPos.z);
    camera.lookAt(0, 0.1, 0);

    // Hover Turbulence
    const hoverY = Math.sin(time * 2.2) * 0.035;
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

    // Strobe navigation light
    if (strobeWhite) {
      strobeWhite.visible = Math.sin(time * 10) > 0.85;
    }

    // Telemetry updates
    if (telemPitch && telemRoll) {
      const pitchDeg = (currentRot.x * (180 / Math.PI)).toFixed(1);
      const rollDeg = (currentRot.z * (180 / Math.PI)).toFixed(1);
      telemPitch.textContent = `${pitchDeg > 0 ? '+' : ''}${pitchDeg}°`;
      telemRoll.textContent = `${rollDeg > 0 ? '+' : ''}${rollDeg}°`;
    }

    renderer.render(scene, camera);
  }

  // Focus on Part: Moves Camera AND Shows In-Stage Pop-Up Card
  function focusOnPart(partIndex) {
    if (partIndex < 0 || partIndex >= PART_PRESETS.length) return;
    const part = PART_PRESETS[partIndex];

    targetCamPos = { x: part.cam.x, y: part.cam.y, z: part.cam.z };
    targetRot = { x: part.rot.x, y: part.rot.y, z: part.rot.z };
    autoOrbit = false;

    // Show In-Stage Pop-Up Card
    const popup = document.getElementById('part-stage-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupBadge = document.getElementById('popup-badge');
    const popupDesc = document.getElementById('popup-desc');
    const popupSpecs = document.getElementById('popup-specs');

    if (popupTitle) popupTitle.textContent = part.name;
    if (popupBadge) popupBadge.textContent = part.badge;
    if (popupDesc) popupDesc.textContent = part.desc;

    if (popupSpecs) {
      popupSpecs.innerHTML = part.specs.map(s => `
        <div class="p-1.5 rounded bg-slate-50 border border-slate-100">
          <span class="text-slate-400 block text-[9px] uppercase font-bold">${s.label}</span>
          <span class="text-slate-900 font-extrabold block truncate">${s.val}</span>
        </div>
      `).join('');
    }

    if (popup) {
      popup.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-3');
      popup.classList.add('opacity-100', 'translate-y-0');
    }
  }

  function closeStagePopup() {
    const popup = document.getElementById('part-stage-popup');
    if (popup) {
      popup.classList.add('opacity-0', 'pointer-events-none', 'translate-y-3');
      popup.classList.remove('opacity-100', 'translate-y-0');
    }
  }

  function resetView() {
    targetRot = { ...DEFAULT_ROT };
    targetCamPos = { ...DEFAULT_CAM };
    autoOrbit = true;
    closeStagePopup();
  }

  // Export globally
  window.AeroBMSCE_Aircraft = {
    focusOnPart: focusOnPart,
    closeStagePopup: closeStagePopup,
    resetView: resetView
  };
})();
