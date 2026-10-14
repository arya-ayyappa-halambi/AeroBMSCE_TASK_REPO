# AeroBMSCE // Official Aerospace & UAV Club Web Platform
> **B.M.S. College of Engineering (BMSCE), Propel Lab–3, Bengaluru**  
> *Target Deployment: Static GitHub Pages | Stack: Three.js (Interactive 3D Engine), Lucide Vectors, Tailwind CSS & Modern Aerospace Design System.*

---

## 🛰️ 1. Forensic Audit: What Was Broken in the Original Site & Architectural Resolutions

| Flaw Identified in Original Site | Root Cause in Legacy Code | Architectural Resolution in Revamped Build |
| :--- | :--- | :--- |
| **Hardcoded Width Layout Collapse** | `.wrap { width: 1480px; }` and `.banner { width: 1480px; }` in `style.css`. Broke completely on laptops and mobile devices with massive horizontal overflow. | Re-engineered with responsive Tailwind CSS Grid and Flexbox layouts. Fluid across mobile, tablet, and widescreen displays. |
| **Unreadable Contrast & Harsh Fonts** | Dark gray text (`#707070`) set in `Times New Roman 13px` against dark background (`#141414`), paired with harsh `Impact` headers and maroon `#7b2339`. | Modern, vibrant aerospace aesthetic (Stratospheric Luminous White, Royal Cobalt `#0A47FF`, and Safety Orange `#FF5722`), with prestigious **Outfit** headings and crisp **Plus Jakarta Sans** body typography. |
| **Distracting Graph-Paper CAD Grids** | Heavy repeating background grid lines that cluttered the viewport and impaired legibility. | Completely eliminated background grid lines; replaced with smooth, atmospheric aerodynamic lighting gradients. |
| **Fatal JavaScript Crash** | `script.js` called `document.getElementById("slide").src = ...` on an un-checked `setInterval()`, throwing fatal runtime errors on pages without `#slide`. | Robust, scoped modular JavaScript with null-checks, clean event delegation, and zero runtime console exceptions. |
| **Distorted Image Aspect Ratios** | Fixed dimensions forced on header logo (`420x200px`) and banner (`1480x160px`) squished photos (`photo8.jpg`). | Responsive aspect-ratio containers (`object-cover` and `object-contain`) preserving authentic photographic proportions. |
| **Dead Links & 404s** | Navigation pointed to `contact.html` (which did not exist), while `#who` used obsolete `<a name="who">`. | Unified single-page architecture (SPA) with smooth anchor transitions, verified targets, and an active recruitment/inquiry form. |
| **Artificial Commercial Tiers** | Corporate "Platinum, Gold, Silver" pricing packages that did not reflect a student college club. | Replaced with genuine **Collaborators & Technical Ecosystem** showcasing real industry partners (**DRDO**, **CSIR-NAL**, **SolidWorks**, **Ansys**, **Altair**, **Siemens**). |

---

## 🎨 2. Design System & Clean Aerospace Aesthetics

* **Vibrant Stratospheric Palette**: Luminous crisp background (`#F8FAFC`), deep Royal Cobalt (`#0A47FF`), Safety Orange (`#FF5722`), Aerospace Gold (`#F59E0B`), and radiant HUD Cyan (`#00F0FF`).
* **World-Class Typography**:
  - Headings & Display: **Outfit** (clean, geometric, aerodynamically proportioned).
  - Body & UI: **Plus Jakarta Sans** (crisp, readable, modern).
  - Telemetry: **JetBrains Mono** (precision raw engineering readouts).
* **Authentic Heritage**: Grounded in the real history of AeroBMSCE (founded 2012, Propel Lab–3, 10+ BMSCE departments).
* **The 4 Real Competitive Squadrons**:
  1. **Team Yaksha** (International Competitions / SAE Aero Design)
  2. **Team Blue Impulse** (Aeromodelling & Heavy Lift)
  3. **Team Flying Phantoms** (Autonomous Drone Development)
  4. **Team Vectors** (High-Speed Drone Racing)
* **Real R&D Initiatives**: Indigenous Flight Controller, High-Efficiency ESCs, GPS-Denied Autonomous Navigation, DRDO Collaborative Defense Project, and Morphing Wingtips.
* **Interactive Real Photo Lightbox**: High-resolution gallery featuring the real team photos (`photo1.jpg` – `photo8.jpg`) from the workshop, airfield, and competition displays.

---

## 🛩️ 3. Interactive 3D Aircraft Visualizer (`Three.js`)

A dedicated, high-impact WebGL stage in the Hero section renders an authentic parametric supersonic delta-wing UAV (`VAYU-01`):

* **High-Contrast Aerospace Livery**: Carbon titanium composite fuselage (`#1E293B`), royal cobalt blue wings (`#0A47FF`), safety orange elevons (`#FF5722`), and a glowing cyan HUD cockpit canopy with internal instrument glow.
* **Direct 360° Mouse & Touch Drag**: Spin the aircraft smoothly in all three axes with physical momentum damping.
* **Mouse Wheel Zoom**: Smooth zoom in/out with clamped distance bounds (2.4 to 8.0 units).
* **Dynamic Control Surfaces**: Actuated elevons actively deflect in response to pitch and roll angles in real-time.
* **Interactive Hotspot System**: 4 component focus buttons (`AVIONICS`, `DELTA WING`, `PROPULSION`, `AIRFRAME`) that smoothly glide the 3D camera into position and open a technical flight systems modal.
* **Holographic CAD Wireframe Toggle**: Instant 1-click toggle between full composite solid livery and glowing blueprint wireframe mode.
* **Live Telemetry Bar**: Real-time roll, pitch, and flight status indicators.
* **Zero-Latency Loading**: Bundled local vendor Three.js and Lucide libraries with seamless CDN fallbacks.

---

## 🚀 4. Local Setup & 1-Click Deployment to GitHub Pages

### Local Preview
```bash
cd AeroBMSCE
python3 -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

### 1-Click GitHub Pages Deployment
1. Initialize git and commit:
   ```bash
   git add .
   git commit -m "feat: complete AeroBMSCE website revamp with 3D aircraft stage, modern typography, and real club assets"
   git branch -M main
   git remote add origin https://github.com/<your-username>/AeroBMSCE.git
   git push -u origin main
   ```
2. Enable GitHub Pages in your repository settings:
   - Navigate to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and root `/`, then click **Save**.
   - Your site will be live at `https://<your-username>.github.io/AeroBMSCE/` within 60 seconds.

---

## 📋 5. Asset Inventory & Verification
* `images/logo.png`: Official AeroBMSCE Golden Eagle Insignia (rendered crisply without awkward borders).
* `images/header-logo.png`: Official wide emblem with authentic club motto.
* `images/photo1.jpg` – `photo8.jpg`: Workshop, flight line, pilot crew, and competition photos with interactive lightbox.
* `images/drdo.png`, `csir-nal.png`, `solidworks.png`, `ansys.png`, `altair.png`, `siemens.png`, `flow5.png`, `simscale.png`: Genuine collaborator and software ecosystem partners.
* `js/three-aircraft.js`: Parametric 3D WebGL aircraft engine with OrbitControls, active elevons, and CAD wireframe toggle.
* `js/vendor/three.min.js`: Bundled local Three.js r128 engine.
* `js/vendor/lucide.min.js`: Bundled local Lucide SVG icon suite.
