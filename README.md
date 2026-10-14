# AeroBMSCE // Official Aerospace & Aeromodelling Club Web Platform
> **B.M.S. College of Engineering (BMSCE), Propel Lab–3, Bengaluru**  
> **Public GitHub Repository**: [https://github.com/arya-ayyappa-halambi/AeroBMSCE_TASK_REPO](https://github.com/arya-ayyappa-halambi/AeroBMSCE_TASK_REPO)  
> **Live Deployed Site**: [https://arya-ayyappa-halambi.github.io/AeroBMSCE_TASK_REPO/](https://arya-ayyappa-halambi.github.io/AeroBMSCE_TASK_REPO/)  
> *Stack: Three.js (Interactive 3D Engine), Lucide SVG Vectors, Tailwind CSS & Bespoke Aerospace Design System.*

---

## 📋 Mandatory Recruitment Task Questions & Architectural Responses

### Question 1: Touch upon the flaws of the original website. What were the most noticeable things that you came across?

During our forensic audit of the legacy AeroBMSCE repository, we identified several critical structural, design, and functional failures:

1. **Rigid Hardcoded Layout Collapse**:
   - The legacy `style.css` enforced fixed-width containers: `.wrap { width: 1480px; }` and `.banner { width: 1480px; }`.
   - On standard laptop displays (1366×768 or 1440×900) as well as mobile devices, this caused catastrophic horizontal overflow, breaking the entire viewport alignment and forcing clumsy horizontal scrolling.
2. **Severe Contrast & Typographic Accessibility Failures**:
   - The body copy used low-contrast dark gray text (`#707070`) set in tiny `Times New Roman 13px` over a dark `#141414` background, failing basic WCAG AAA/AA readability standards.
   - Headings relied on harsh, outdated fonts like `Impact` combined with jarring maroon accent buttons (`#7b2339`), which felt disjointed from an elite collegiate aerospace laboratory.
3. **Distorted Image Aspect Ratios**:
   - The original club logo was forced into a stretched `420×200px` container, while the banner was forced into `1480×160px`. This squished the authentic team photos (such as `photo8.jpg`) and distorted the club's Golden Eagle insignia.
4. **Dead Links and Deprecated Anchor Tags**:
   - The navigation pointed to a missing `contact.html` file (returning a 404 error), while in-page anchors used obsolete HTML syntax (`<a name="who">`).
5. **Runtime JavaScript Crash**:
   - The original `script.js` executed an unchecked `setInterval()` attempting to mutate `document.getElementById("slide").src`. When run on any page or view without `#slide`, it threw unhandled null reference exceptions, halting subsequent scripts.
6. **Commercial/Corporate Mismatch vs. Authentic Club Heritage**:
   - The original page structure used generic SaaS marketing tropes that did not reflect the actual accomplishments of BMSCE's premier aeromodelling club, its 16+ year history in Propel Lab–3, or its podium finishes at the SAE International Aero Design series in the USA.

---

### Question 2: Brief explanation of your design route and any decisions you took on designing the UI/UX.

Our objective was to build a standout, hyper-performant, visually distinctive website tailored specifically to **AeroBMSCE's identity as a collegiate aerospace engineering laboratory**:

1. **Aesthetic Direction — Luminous Stratospheric & Cockpit Telemetry**:
   - We avoided generic SaaS dark purple glow grids and clunky graph-paper patterns. Instead, we developed a luminous, modern aerospace visual language:
   - Clean, high-altitude stratospheric palette: crisp alpine white/slate surfaces (`#F8FAFC`, `#FFFFFF`) accented by deep **Royal Cobalt Blue** (`#0A47FF`), **Aerospace Safety Orange** (`#FF5722`), and **Golden Eagle Amber** (`#F59E0B`).
   - Smooth, aerodynamic ambient airflow gradients replacing distracting background line grids.
2. **Typography System — "Outfit" + "Plus Jakarta Sans"**:
   - **Headings & Display**: Selected **Outfit** for all titles and headlines. Its geometric, aerodynamically proportioned letterforms provide an elite, modern aerospace feel similar to Boom Supersonic and SpaceX design systems.
   - **Body & Navigation**: Selected **Plus Jakarta Sans** for clean, readable, contemporary typography across all descriptions, cards, and navigation links.
   - **Telemetry**: Reserved **JetBrains Mono** strictly for genuine numerical flight data, GPS coordinates (`12.9416° N // 77.5658° E`), and raw telemetry readouts.
3. **Hero Centerpiece — Real 3D Interactive Aircraft Stage (`Three.js`)**:
   - Designed a dedicated interactive 3D flight stage showcasing the **VAYU-01 Supersonic Delta UAV**.
   - Built authentic physical details: silver nose pitot-static tube, transparent cockpit canopy with visible internal Pixhawk flight controller cube and HUD glow, reflexed camber delta wings with anti-vortex wingtip fence winglets, actuated elevons with mechanical servo pushrods, and a rapidly spinning carbon-fiber pusher propeller.
   - **Direct 360° Interaction**: Users can freely click/drag with mouse or touch to rotate the aircraft with momentum damping, and zoom in/out with the mouse wheel.
   - **In-Stage HUD Inspection Pop-Up**: Touching or clicking component buttons (`1. AVIONICS`, `2. DELTA WING`, `3. PROPULSION`, `4. AIRFRAME`) glides the 3D camera into a close-up focus and pops up an engineering specification card right on the stage without obscuring the rest of the site.
   - **CAD Wireframe Toggle**: Instant 1-click switch between full carbon composite solid livery and a glowing blueprint wireframe hologram.
4. **Authentic BMSCE Club Content & Asset Integration**:
   - Extracted and integrated all real photographic assets (`photo1.jpg` to `photo8.jpg`) into an interactive lightbox gallery.
   - Organized the club into its true 4 competitive divisions: **Team Yaksha** (SAE Aero Design), **Team Blue Impulse** (Aeromodelling), **Team Flying Phantoms** (Autonomous Drones), and **Team Vectors** (Drone Racing).
   - Showcased genuine R&D projects (DRDO defense collaboration, GPS-denied navigation, indigenous ESCs) and real collaborator logos (CSIR-NAL, DRDO, SolidWorks, Ansys, Altair, Siemens) with proper contrast filtering.

---

### Question 3: Describe one problem/edge case you faced while building your website. Explain the problem, how you ran into it, and the steps you took to work around it.

#### The Problem: Temporal Dead Zone (TDZ) ReferenceError Halting WebGL Initialization in Safari
* **How We Ran Into It**:  
  When testing the revamped 3D aircraft stage on Safari (macOS), the stage container and HTML UI loaded cleanly, but the Three.js canvas remained completely blank. The live telemetry numbers also stayed frozen at their initial HTML default (`+12.0°`).
* **Root Cause Forensic Diagnosis**:  
  To pinpoint the failure, we evaluated the script through the native macOS **JavaScriptCore (`jsc`)** engine (the exact JS engine executing inside Safari). The CLI revealed a fatal unhandled exception on line 87:
  ```
  Exception: ReferenceError: Cannot access 'clock' before initialization.
  at animate() (js/three-aircraft.js:87)
  ```
  In ES6 JavaScript, variables declared with `let` and `const` are not hoisted and reside in the **Temporal Dead Zone (TDZ)** until their declaration line is evaluated. The animation loop `animate()` was invoked near the top of the IIFE, but `let clock = new THREE.Clock()` and the telemetry DOM variables (`const telemRoll`, `const telemPitch`) were declared lower down in the file. On the very first frame, `clock.getDelta()` threw a TDZ ReferenceError, halting the entire JavaScript thread **before `renderer.render(scene, camera)` could draw even a single frame**. Additionally, `new ResizeObserver` was called without explicit `window.` qualification, which raised an auxiliary reference error in strict mode.
* **The Architectural Workaround & Step-by-Step Resolution**:
  1. **Hoisting & Scope Reorganization**: Moved `clock = new THREE.Clock()`, `telemRoll = null`, and `telemPitch = null` to the top of the closure scope, ensuring all dependencies are fully initialized before `animate()` is triggered.
  2. **Safe Window Observer Binding**: Guarded the container resize logic with `if (typeof window !== 'undefined' && window.ResizeObserver)` and safely instantiated `new window.ResizeObserver()` inside a `try/catch` block.
  3. **Viewport Scale & Camera Distance Tuning**: The initial aircraft geometry was also too large for the stage container, causing the wingtips to clip. We scaled the aircraft group to `0.85x` and set `camera.position.z = 7.2`, ensuring the entire aircraft—from nose pitot probe to wingtip winglets—fits comfortably inside the viewport with aerodynamic breathing room.
  4. **Verification via `jsc`**: Validated the execution in `jsc`, confirming that multi-frame rendering and camera lerping execute with zero runtime exceptions.

---

## 🚀 4. Local Setup & GitHub Pages Deployment

### Local Development Preview
```bash
# Clone the repository
git clone https://github.com/arya-ayyappa-halambi/AeroBMSCE_TASK_REPO.git
cd AeroBMSCE_TASK_REPO

# Launch a local HTTP server
python3 -m http.server 8080
```
Open **`http://localhost:8080/`** in your browser.

### Automatic GitHub Pages Deployment
This repository is configured with automated continuous deployment:
1. Every commit pushed to `main` automatically triggers the GitHub Actions workflow defined in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
2. The workflow verifies assets, sets up GitHub Pages, and deploys the static files to:  
   **[https://arya-ayyappa-halambi.github.io/AeroBMSCE_TASK_REPO/](https://arya-ayyappa-halambi.github.io/AeroBMSCE_TASK_REPO/)**

---

## 📁 5. Directory Structure & Asset Inventory

```
AeroBMSCE_TASK_REPO/
├── .github/
│   └── workflows/
│       └── deploy.yml             # Automated GitHub Actions Pages deployment
├── css/
│   └── styles.css                 # Custom aerospace design system & styles
├── images/
│   ├── logo.png                   # Official AeroBMSCE Golden Eagle Insignia
│   ├── header-logo.png            # Wide banner logo with club motto
│   ├── photo1.jpg - photo8.jpg    # Authentic workshop, airfield, and competition photos
│   ├── drdo.png, csir-nal.png     # Research and defense collaborator logos
│   └── solidworks.png, ansys.png,
│       altair.png, siemens.png,
│       flow5.png, simscale.png,
│       drkstore.png,
│       uav-marketplace.png        # Software and hardware ecosystem partner logos
├── js/
│   ├── vendor/
│   │   ├── three.min.js           # Local Three.js r128 engine (offline resilient)
│   │   └── lucide.min.js          # Local Lucide vector icon suite
│   ├── three-aircraft.js          # Interactive 3D aircraft engine & in-stage HUD pop-up
│   ├── main.js                    # Lightbox gallery, milestone filters, contact dispatch
│   └── wind-tunnel.js             # Aerodynamic airflow stream simulation
├── index.html                     # Primary single-page application entry point
└── README.md                      # Recruitment task responses & documentation
```
