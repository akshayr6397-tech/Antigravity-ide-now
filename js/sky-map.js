/**
 * ASTROCAL — Interactive Sky Map & Celestial Dome Projection
 * Calculates horizon altitudes, azimuth coordinates, radiant markers, and visibility zones
 */

class SkyMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.currentLocation = window.OBSERVATION_LOCATIONS ? window.OBSERVATION_LOCATIONS[0] : {
      id: 'pune', name: 'Pune, India', lat: 18.5204, lon: 73.8567, bortle: 5, elevation: '560m', timezone: 'IST (UTC+5:30)'
    };

    this.activeEvent = window.CELESTIAL_EVENTS ? window.CELESTIAL_EVENTS[0] : null;
    this.hoveredMarker = null;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.size = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left);
      const y = (e.clientY - rect.top);
      this.checkHover(x, y);
    });

    this.canvas.addEventListener('click', () => {
      if (this.hoveredMarker) {
        window.app.openEventDetail(this.hoveredMarker.id);
      }
    });

    this.bindLocationSelector();
    this.render();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const clientWidth = parent.clientWidth || 500;
    this.size = Math.min(clientWidth, 480);

    this.canvas.width = this.size * this.dpr;
    this.canvas.height = this.size * this.dpr;
    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;

    this.ctx.scale(this.dpr, this.dpr);

    this.centerX = this.size / 2;
    this.centerY = this.size / 2;
    this.radius = (this.size / 2) - 30;

    this.render();
  }

  bindLocationSelector() {
    const locationSelect = document.getElementById('sky-location-select');
    if (!locationSelect) return;

    locationSelect.innerHTML = '';
    window.OBSERVATION_LOCATIONS.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = `${loc.name} (${loc.timezone.split(' ')[0]})`;
      if (loc.id === this.currentLocation.id) opt.selected = true;
      locationSelect.appendChild(opt);
    });

    locationSelect.addEventListener('change', (e) => {
      this.setLocation(e.target.value);
    });
  }

  setLocation(locationId) {
    const loc = window.OBSERVATION_LOCATIONS.find(l => l.id === locationId);
    if (loc) {
      this.currentLocation = loc;
      this.updateLocationStatsUI();
      this.render();
      window.app.showToast(`📍 Updated observation point: ${loc.name}`);
    }
  }

  updateLocationStatsUI() {
    const locNameEl = document.getElementById('sky-loc-name');
    const bortleEl = document.getElementById('sky-bortle-val');
    const coordEl = document.getElementById('sky-coords-val');

    if (locNameEl) locNameEl.textContent = this.currentLocation.name;
    if (bortleEl) bortleEl.textContent = `Bortle Class ${this.currentLocation.bortle} · Elev: ${this.currentLocation.elevation}`;
    if (coordEl) coordEl.textContent = `Lat: ${this.currentLocation.lat.toFixed(2)}° | Lon: ${this.currentLocation.lon.toFixed(2)}°`;
  }

  // Calculate projected azimuth/altitude to 2D polar canvas coordinates
  getPolarCoordinates(azimuthDeg, altitudeDeg) {
    // 0 deg Azimuth = North (top), 90 deg = East (right), 180 = South (bottom), 270 = West (left)
    const angleRad = (azimuthDeg - 90) * (Math.PI / 180);
    // Altitude 90 deg = center (zenith), 0 deg = outer circle edge
    const dist = (1 - (altitudeDeg / 90)) * this.radius;

    return {
      x: this.centerX + Math.cos(angleRad) * dist,
      y: this.centerY + Math.sin(angleRad) * dist
    };
  }

  checkHover(x, y) {
    let found = null;
    const markers = this.getMarkersList();

    for (let m of markers) {
      const dist = Math.hypot(m.x - x, m.y - y);
      if (dist < 18) {
        found = m;
        break;
      }
    }

    if (this.hoveredMarker !== found) {
      this.hoveredMarker = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
      this.render();
    }
  }

  getMarkersList() {
    // Coordinate positions customized based on active celestial events
    return [
      {
        id: 'perseids-2026',
        name: 'Perseids Radiant',
        azimuth: 45, // Northeast
        altitude: 48,
        color: '#00DFD8',
        icon: '☄️',
        rate: '100 meteors/hr',
        ...this.getPolarCoordinates(45, 48)
      },
      {
        id: 'geminids-2026',
        name: 'Geminids Zenith',
        azimuth: 110, // East-Southeast
        altitude: 82, // Near Zenith
        color: '#6366F1',
        icon: '🌠',
        rate: '150 meteors/hr',
        ...this.getPolarCoordinates(110, 82)
      },
      {
        id: 'planetary-alignment-2026',
        name: 'Jupiter-Saturn Arc',
        azimuth: 135, // Southeast
        altitude: 52,
        color: '#8B5CF6',
        icon: '🪐',
        rate: '5 Planets visible',
        ...this.getPolarCoordinates(135, 52)
      },
      {
        id: 'super-harvest-moon-2026',
        name: 'Supermoon Perigee',
        azimuth: 155, // South-Southeast
        altitude: 68,
        color: '#EC4899',
        icon: '🌕',
        rate: '100% Illum',
        ...this.getPolarCoordinates(155, 68)
      },
      {
        id: 'iss-pass-pune',
        name: 'ISS Flight Arc',
        azimuth: 220, // Southwest
        altitude: 79,
        color: '#10B981',
        icon: '🛰️',
        rate: 'Mag -3.9',
        ...this.getPolarCoordinates(220, 79)
      }
    ];
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.size, this.size);

    // 1. Sky Dome Background Circle with Deep Cosmic Gradient
    const skyGrad = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, this.radius);
    skyGrad.addColorStop(0, '#0c1322');
    skyGrad.addColorStop(0.7, '#070b14');
    skyGrad.addColorStop(1, '#030508');

    this.ctx.fillStyle = skyGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Glowing Horizon Border
    this.ctx.strokeStyle = 'rgba(0, 223, 216, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // 3. Concentric Altitude Grid Rings (30°, 60°) & Crosshairs
    const altRings = [30, 60];
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);

    altRings.forEach(alt => {
      const r = (1 - (alt / 90)) * this.radius;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      this.ctx.stroke();
    });

    // Crosshairs
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY - this.radius);
    this.ctx.lineTo(this.centerX, this.centerY + this.radius);
    this.ctx.moveTo(this.centerX - this.radius, this.centerY);
    this.ctx.lineTo(this.centerX + this.radius, this.centerY);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash

    // 4. Cardinal Compass Direction Indicators (N, E, S, W, NE, SE, SW, NW)
    const directions = [
      { label: 'N', angle: -90, color: '#00DFD8' },
      { label: 'NE', angle: -45, color: '#94a3b8' },
      { label: 'E', angle: 0, color: '#ffffff' },
      { label: 'SE', angle: 45, color: '#94a3b8' },
      { label: 'S', angle: 90, color: '#ffffff' },
      { label: 'SW', angle: 135, color: '#94a3b8' },
      { label: 'W', angle: 180, color: '#ffffff' },
      { label: 'NW', angle: 225, color: '#94a3b8' }
    ];

    this.ctx.font = '600 11px "Space Grotesk", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    directions.forEach(d => {
      const rad = d.angle * (Math.PI / 180);
      const textX = this.centerX + Math.cos(rad) * (this.radius + 16);
      const textY = this.centerY + Math.sin(rad) * (this.radius + 16);
      this.ctx.fillStyle = d.color;
      this.ctx.fillText(d.label, textX, textY);
    });

    // Altitude Labels (Zenith 90°, 60°, 30°)
    this.ctx.font = '500 9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.fillText('90° (Zenith)', this.centerX, this.centerY + 12);
    this.ctx.fillText('60°', this.centerX, this.centerY - (1 - (60 / 90)) * this.radius - 6);
    this.ctx.fillText('30°', this.centerX, this.centerY - (1 - (30 / 90)) * this.radius - 6);

    // 5. Render ISS Flight Path Curved Trajectory
    this.renderOrbitPath();

    // 6. Render Celestial Event Radiant Markers
    const markers = this.getMarkersList();
    markers.forEach(m => {
      const isHovered = this.hoveredMarker && this.hoveredMarker.id === m.id;

      // Outer Pulse Ring
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, isHovered ? 14 : 9, 0, Math.PI * 2);
      this.ctx.strokeStyle = m.color;
      this.ctx.lineWidth = isHovered ? 2 : 1;
      this.ctx.globalAlpha = isHovered ? 0.9 : 0.5;
      this.ctx.stroke();

      // Glowing Center Dot
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = m.color;
      this.ctx.globalAlpha = 1.0;
      this.ctx.fill();

      // Label Tag
      this.ctx.font = '600 10px "Space Grotesk", sans-serif';
      this.ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
      this.ctx.fillText(m.name, m.x, m.y - 14);
    });

    // 7. Render Hover Tooltip Box if Marker is Focused
    if (this.hoveredMarker) {
      this.renderTooltip(this.hoveredMarker);
    }
  }

  renderOrbitPath() {
    const p1 = this.getPolarCoordinates(220, 15); // SW horizon
    const p2 = this.getPolarCoordinates(170, 79); // Peak
    const p3 = this.getPolarCoordinates(45, 20);  // NE horizon

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
    this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([3, 3]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  renderTooltip(m) {
    const boxW = 140;
    const boxH = 54;
    let boxX = m.x + 12;
    let boxY = m.y + 12;

    if (boxX + boxW > this.size) boxX = m.x - boxW - 12;
    if (boxY + boxH > this.size) boxY = m.y - boxH - 12;

    // Box Background
    this.ctx.fillStyle = 'rgba(14, 21, 37, 0.95)';
    this.ctx.strokeStyle = m.color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Text details
    this.ctx.textAlign = 'left';
    this.ctx.font = '700 11px "Space Grotesk", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`${m.icon} ${m.name}`, boxX + 8, boxY + 16);

    this.ctx.font = '500 9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText(`Alt: ${m.altitude}° | Az: ${m.azimuth}°`, boxX + 8, boxY + 30);
    this.ctx.fillStyle = m.color;
    this.ctx.fillText(`Rate: ${m.rate}`, boxX + 8, boxY + 44);
  }
}

window.SkyMap = SkyMap;
