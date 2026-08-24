/**
 * ASTROCAL — Cosmic Starfield & Meteor Canvas Engine
 * High-fidelity astronomical starry sky, constellation tracing, and shooting meteors
 */

class CosmicCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;

    this.stars = [];
    this.meteors = [];
    this.nebulae = [];

    this.mouse = {
      x: -1000,
      y: -1000,
      radius: 140,
      isHovering: false
    };

    // Star Spectral Palette (O, B, A, F, G, K, M stellar classes)
    this.starColors = [
      '#FFFFFF', // White
      '#CDE8FF', // Soft Blue
      '#9BC5FF', // Deep Blue
      '#FFF0D0', // Warm Yellow
      '#FFE0B0', // Golden Orange
      '#FFB8B8'  // Soft Crimson
    ];

    this.lastMeteorTime = performance.now();
    this.meteorInterval = 2800; // ms between natural shooting stars

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.isHovering = true;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      this.mouse.isHovering = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    this.canvas.addEventListener('click', (e) => {
      this.spawnMeteorBurst(e.clientX, e.clientY);
    });

    this.initNebulae();
    this.initStars();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this.initStars();
  }

  initNebulae() {
    this.nebulae = [
      { x: 0.2, y: 0.25, r: 350, color: 'rgba(121, 40, 202, 0.09)' },
      { x: 0.8, y: 0.45, r: 420, color: 'rgba(0, 223, 216, 0.08)' },
      { x: 0.5, y: 0.8, r: 480, color: 'rgba(236, 72, 153, 0.06)' }
    ];
  }

  initStars() {
    this.stars = [];
    const count = Math.floor((this.width * this.height) / 3800); // Responsive density

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() < 0.85 ? Math.random() * 1.2 + 0.4 : Math.random() * 2.2 + 1.2,
        color: this.starColors[Math.floor(Math.random() * this.starColors.length)],
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        isMajorStar: Math.random() < 0.08
      });
    }
  }

  spawnMeteor(originX = null, originY = null) {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35; // ~45 deg downward streak
    const speed = Math.random() * 12 + 16;
    const length = Math.random() * 140 + 90;

    const startX = originX !== null ? originX : Math.random() * this.width * 0.8;
    const startY = originY !== null ? originY : Math.random() * (this.height * 0.4);

    this.meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: length,
      width: Math.random() * 2.2 + 1.5,
      alpha: 1.0,
      decay: Math.random() * 0.018 + 0.012,
      color: Math.random() < 0.3 ? '#00DFD8' : '#FFFFFF',
      particles: []
    });
  }

  spawnMeteorBurst(x, y) {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.spawnMeteor(x + (Math.random() - 0.5) * 100, y + (Math.random() - 0.5) * 50);
      }, i * 120);
    }
  }

  renderNebulae() {
    const time = performance.now() * 0.0002;
    this.nebulae.forEach((n, idx) => {
      const px = (n.x + Math.sin(time + idx) * 0.03) * this.width;
      const py = (n.y + Math.cos(time + idx) * 0.03) * this.height;

      const grad = this.ctx.createRadialGradient(px, py, 0, px, py, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, n.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderConstellationLines() {
    if (!this.mouse.isHovering) return;

    const nearbyStars = [];
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const dist = Math.hypot(s.x - this.mouse.x, s.y - this.mouse.y);
      if (dist < this.mouse.radius) {
        nearbyStars.push({ star: s, dist });
      }
    }

    // Connect nearby stars with faint celestial lines
    for (let i = 0; i < nearbyStars.length; i++) {
      const s1 = nearbyStars[i].star;

      // Line to mouse cursor
      const cursorAlpha = (1 - nearbyStars[i].dist / this.mouse.radius) * 0.45;
      this.ctx.beginPath();
      this.ctx.moveTo(s1.x, s1.y);
      this.ctx.lineTo(this.mouse.x, this.mouse.y);
      this.ctx.strokeStyle = '#00DFD8';
      this.ctx.globalAlpha = cursorAlpha;
      this.ctx.lineWidth = 0.8;
      this.ctx.stroke();

      // Line between neighbor stars
      for (let j = i + 1; j < nearbyStars.length; j++) {
        const s2 = nearbyStars[j].star;
        const pairDist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
        if (pairDist < 110) {
          const lineAlpha = (1 - pairDist / 110) * 0.35;
          this.ctx.beginPath();
          this.ctx.moveTo(s1.x, s1.y);
          this.ctx.lineTo(s2.x, s2.y);
          this.ctx.strokeStyle = '#7928CA';
          this.ctx.globalAlpha = lineAlpha;
          this.ctx.lineWidth = 0.6;
          this.ctx.stroke();
        }
      }
    }
    this.ctx.globalAlpha = 1.0;
  }

  renderStars(now) {
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];

      // Twinkle calculation
      const twinkle = Math.sin(now * s.twinkleSpeed + s.twinklePhase);
      const alpha = Math.max(0.15, s.baseAlpha + twinkle * 0.35);

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fill();

      // Major Star Cross Diffraction Flare
      if (s.isMajorStar && alpha > 0.6) {
        this.ctx.strokeStyle = s.color;
        this.ctx.globalAlpha = (alpha - 0.4) * 0.5;
        this.ctx.lineWidth = 0.6;
        const spikeLen = s.radius * 3.5;

        this.ctx.beginPath();
        this.ctx.moveTo(s.x - spikeLen, s.y);
        this.ctx.lineTo(s.x + spikeLen, s.y);
        this.ctx.moveTo(s.x, s.y - spikeLen);
        this.ctx.lineTo(s.x, s.y + spikeLen);
        this.ctx.stroke();
      }
    }
    this.ctx.globalAlpha = 1.0;
  }

  renderMeteors() {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];

      m.x += m.vx;
      m.y += m.vy;
      m.alpha -= m.decay;

      if (m.alpha <= 0 || m.x > this.width + 200 || m.y > this.height + 200) {
        this.meteors.splice(i, 1);
        continue;
      }

      // Draw Glowing Meteor Head & Trail
      const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
      const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

      const grad = this.ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.2, m.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.beginPath();
      this.ctx.moveTo(m.x, m.y);
      this.ctx.lineTo(tailX, tailY);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = m.width;
      this.ctx.globalAlpha = m.alpha;
      this.ctx.stroke();

      // Head Sparkle
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, m.width * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = m.alpha;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }

  animate() {
    const now = performance.now();

    // Clear with dark space backdrop
    this.ctx.fillStyle = '#030508';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render layers
    this.renderNebulae();
    this.renderConstellationLines();
    this.renderStars(now);
    this.renderMeteors();

    // Natural random shooting stars
    if (now - this.lastMeteorTime > this.meteorInterval) {
      if (Math.random() < 0.65) {
        this.spawnMeteor();
      }
      this.lastMeteorTime = now;
      this.meteorInterval = Math.random() * 2500 + 2000;
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.CosmicCanvas = CosmicCanvas;
