# AeroBMSCE Website Revamp — Recruitment Task 2026
> **B.M.S. College of Engineering (BMSCE), Propel Lab–3, Bengaluru**  
> **GitHub Repository**: [https://github.com/arya-ayyappa-halambi/AeroBMSCE_TASK_REPO](https://github.com/arya-ayyappa-halambi/AeroBMSCE_TASK_REPO)  
> **Live Website**: [https://arya-ayyappa-halambi.github.io/AeroBMSCE_TASK_REPO/](https://arya-ayyappa-halambi.github.io/AeroBMSCE_TASK_REPO/)  

---

## 📝 Answers to Recruitment Task Questions

### 1. Touch upon the flaws of the original website. What were the most noticeable things that you came across?

When I first opened and explored the provided codebase, here were the most noticeable issues I found:

* **Broken Layout & Horizontal Scrolling**: The CSS had hardcoded fixed widths (`.wrap { width: 1480px; }` and `.banner { width: 1480px; }`). On my laptop screen (and on mobile devices), the page completely broke and forced an annoying horizontal scrollbar. It was not responsive at all.
* **Hard-to-read Colors and Fonts**: The text was dark gray (`#707070`) set in tiny `Times New Roman 13px` on a dark background, which was really straining to read. The headings used `Impact` with maroon buttons (`#7b2339`), which gave the site an outdated feel rather than looking like an active college aerospace club.
* **Stretched and Squished Images**: Images like the club logo and the runway banner had hardcoded CSS dimensions (`420x200px` and `1480x160px`). This squished the actual photos of the planes (`photo8.jpg`) and distorted the golden eagle emblem.
* **Dead Links & Broken Navigation**: The "Contact" button in the menu pointed to a `contact.html` file that did not exist (giving a 404 error), and internal section links used outdated `<a name="who">` tags.
* **JavaScript Console Error on Load**: In `script.js`, there was a `setInterval()` trying to change the `src` of an element with `id="slide"`. Since that element wasn't on the page, it was throwing a `TypeError: null is not an object` in the browser console right when the page loaded.
* **Missing Club Identity**: The original site had very little real context about AeroBMSCE's actual heritage—like operating from Propel Lab–3, participating in the SAE Aero Design competition in the USA, or having different dedicated squadrons (heavy-lift, RC planes, FPV drones).

---

### 2. Brief explanation of your design route and any decisions you took on designing the UI/UX.

I wanted the revamped website to feel energetic, modern, and genuinely focused on aerospace engineering:

* **Theme & Colors**: Instead of a dark generic template or busy graph-paper grid, I went with a clean, bright, stratospheric look. The background is a clean off-white (`#F8FAFC`) with soft atmospheric blue glows. I used Royal Cobalt Blue (`#0A47FF`), Aerospace Safety Orange (`#FF5722`), and Gold (`#F59E0B`) to match the AeroBMSCE golden eagle insignia.
* **Better Typography**: I replaced Times New Roman with **Outfit** for all headings (it has a clean, geometric, aerodynamic feel) and **Plus Jakarta Sans** for paragraph text and buttons so everything is easy to read. I kept a monospace font (`JetBrains Mono`) only for real technical numbers like GPS coordinates and live pitch/roll telemetry.
* **Interactive 3D Aircraft in the Hero Section**: Since AeroBMSCE designs and flies UAVs, I used Three.js to build a 3D model of a delta-wing UAV (`VAYU-01`) right in the hero section. I added realistic details like a nose pitot probe, a transparent canopy showing the Pixhawk flight controller inside, delta wings with wingtip winglets, working elevons, and a spinning rear propeller. Visitors can click and drag to rotate it 360°, zoom with the scroll wheel, and toggle between a solid paint scheme and a CAD wireframe.
* **Touch / Click In-Stage Part Pop-up**: Below the 3D model, I added 4 buttons: **Avionics**, **Delta Wing**, **Propulsion**, and **Airframe**. When clicked or touched, the 3D camera smoothly zooms in to that exact part, and a clean pop-up card appears right inside the stage showing its specs (processor, motor KV, airfoil, carbon fiber layup) with a close button.
* **Real Photos & Squadrons**: I used the real workshop and flight photos from the club (`photo1.jpg` to `photo8.jpg`) and built a clean lightbox popup when you click on them. I also organized the club into its 4 real divisions: **Team Yaksha** (heavy-lift SAE Aero Design), **Team Blue Impulse** (aeromodelling), **Team Flying Phantoms** (autonomous drones), and **Team Vectors** (FPV drone racing), and showcased real collaborators like DRDO, CSIR-NAL, SolidWorks, and Ansys.

---

### 3. Describe one problem/edge case you faced while building your website. Explain the problem, how you ran into it, and the steps you took to work around it.

#### The Problem:
While building and testing the website on Safari on my Mac, I ran into two noticeable problems:
1. The 3D aircraft stage loaded completely blank and white—the aircraft wasn't rendering at all, and the pitch/roll telemetry text stayed frozen.
2. In the collaborator section, two partner logo cards (`drkstore` and `uav-marketplace`) showed up as completely blank white boxes.

#### How I Ran Into It & Debugged It:
* For the 3D stage, I checked if WebGL was supported (it was), but the canvas just remained empty. With the help of AI to inspect the browser runtime, we tested the script using `jsc` (the macOS JavaScriptCore engine) to see the console errors. It immediately caught this error on the very first frame:
  ```
  ReferenceError: Cannot access 'clock' before initialization at animate()
  ```
* In modern JavaScript, `let` and `const` variables are not hoisted (Temporal Dead Zone). The `animate()` loop was being started near the top of the script, but `let clock = new THREE.Clock()` and the telemetry elements were declared further down. Because `animate()` ran first, `clock.getDelta()` threw a ReferenceError immediately, which crashed the script before `renderer.render()` could even draw the first frame!
* For the partner logos, I checked the PNG files directly and noticed that `drkstore.png` and `uav-marketplace.png` had pure white graphics on transparent backgrounds. When placed on white card boxes (`#FFFFFF`), white-on-white made them completely invisible.

#### Steps Taken to Fix:
1. **Fixed the Variable Hoisting**: I moved `let clock = new THREE.Clock()`, `telemRoll`, and `telemPitch` to the top of the file so they are already initialized when `animate()` starts. I also safely wrapped `window.ResizeObserver` in a check so it wouldn't throw errors in strict environments.
2. **Fixed 3D Model Scale & Framing**: When it first rendered, the plane was too zoomed in and the wingtips were clipped off. I scaled the aircraft to `0.85` and set the camera distance to `z = 7.2` so the entire plane fits nicely inside the container with breathing room.
3. **Fixed the Invisible White Logos**: In `index.html`, I added CSS `filter: invert(1)` to `drkstore.png` and `uav-marketplace.png`. This cleanly inverted the white text and drone emblem into crisp, dark charcoal logos, making them clearly visible on the white cards alongside SolidWorks and Siemens.

---

## 🛠️ Tech Stack Used
* **HTML5 / CSS3 / Vanilla JavaScript**
* **Tailwind CSS** (via CDN for responsive layout)
* **Three.js** (for the 3D rotatable aircraft visualizer)
* **Lucide Icons** (clean SVG vector icons)
* **Google Fonts** (Outfit, Plus Jakarta Sans, JetBrains Mono)
* **GitHub Pages & GitHub Actions** (for static hosting and CI/CD)

---

## 💻 Running Locally
```bash
# Clone the repository
git clone https://github.com/arya-ayyappa-halambi/AeroBMSCE_TASK_REPO.git
cd AeroBMSCE_TASK_REPO

# Start local preview server
python3 -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.
