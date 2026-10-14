/**
 * AeroBMSCE // Computational Wind-Tunnel Streamlines Engine
 * HTML5 Canvas fluid bezier particle simulation around an aerodynamic airfoil.
 * Real-time particle acceleration, vorticity trails, and pressure gradients.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('windtunnel-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 90;
  let flowSpeed = 2.8;
  let angleOfAttack = 4.5; // degrees

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    width = parent.clientWidth;
    height = parent.clientHeight;
    canvas.width = width;
    canvas.height = height;
    initParticles();
  }

  class StreamlineParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : -10;
      this.y = (Math.random() * 0.85 + 0.08) * height;
      this.baseY = this.y;
      this.speed = (Math.random() * 1.5 + flowSpeed);
      this.length = Math.random() * 22 + 14;
      this.alpha = Math.random() * 0.5 + 0.3;
      this.history = [];
      this.maxHistory = 10;
    }

    update() {
      // Streamline physics around central aircraft profile
      const cx = width * 0.5;
      const cy = height * 0.52;
      const dx = this.x - cx;
      const dy = this.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deflection around airfoil zone
      const influenceRadius = 140;
      let vy = 0;
      let vx = this.speed;

      if (dist < influenceRadius && dx < 100) {
        const factor = (1 - dist / influenceRadius);
        // Suction crest (upper surface acceleration)
        if (dy < 0) {
          vy = -factor * 2.2 - (angleOfAttack * 0.08);
          vx = this.speed * (1 + factor * 0.6); // Bernoulli acceleration
        } else {
          // Pressure stagnation (lower surface deceleration)
          vy = factor * 1.8;
          vx = this.speed * (1 - factor * 0.2);
        }
      } else {
        // Natural return to streamline baseline
        vy = (this.baseY - this.y) * 0.03;
      }

      this.x += vx;
      this.y += vy;

      // Keep trace history
      this.history.unshift({ x: this.x, y: this.y });
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }

      // Reset when exiting right
      if (this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      if (this.history.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);

      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }

      // Gradient color based on flow velocity (Cyan for fast, Orange for high-pressure stagnation)
      const isFast = this.y < height * 0.52;
      ctx.strokeStyle = isFast
        ? `rgba(0, 240, 255, ${this.alpha})`
        : `rgba(255, 87, 34, ${this.alpha})`;
      ctx.lineWidth = isFast ? 1.4 : 1.1;
      ctx.stroke();

      // Leading particle spark
      ctx.beginPath();
      ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = isFast ? '#00F0FF' : '#FF5722';
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new StreamlineParticle());
    }
  }

  function render() {
    requestAnimationFrame(render);
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
  }

  window.addEventListener('resize', resize);
  resize();
  render();

  // Public controls
  window.AeroBMSCE_WindTunnel = {
    setSpeed: (spd) => { flowSpeed = spd; },
    setAngle: (aoa) => { angleOfAttack = aoa; }
  };
})();
