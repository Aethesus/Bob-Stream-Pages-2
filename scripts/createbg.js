(() => {
  const canvas = document.getElementById('background');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const backgroundColor = '#340018';
  const contourBaseColor = '#ff9cc9';
  const levels = [0.15, 0.22, 0.29, 0.36, 0.43, 0.50, 0.57, 0.64, 0.71, 0.78];
  const cellSize = 9;

  function hexToRgba(hex, alpha) {
    const value = hex.replace('#', '');
    const full = value.length === 3
      ? value.split('').map((char) => char + char).join('')
      : value;
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const startTime = Date.now() * 0.001;
  let animationTime = startTime;

  function terrainField(x, y, t) {
    const seed = t * 7.8;
    const drift = t * 0.010;
    const angle = seed * 0.45 + 1.3;
    const dx = x - 0.5;
    const dy = y - 0.5;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

    const px = x * 8.8 + Math.sin(y * 3.8 + seed * 0.54) * 0.55 + drift;
    const py = y * 8.8 + Math.cos(x * 4.0 - seed * 0.66) * 0.55 - drift * 0.7;

    const wave1 = Math.sin(px * 1.00 + seed * 0.52);
    const wave2 = Math.cos(py * 1.10 - seed * 0.64);
    const wave3 = Math.sin((px + py) * 1.35 + seed * 0.82);
    const wave4 = Math.cos((rotatedX * 8.6 - rotatedY * 7.2) + seed * 0.86);
    const swirl = Math.sin(Math.hypot(dx, dy) * 16.0 - seed * 1.5) * 0.28;
    const ridge = Math.cos((x * 8.2 + y * 6.9 + seed * 0.52) * 0.9) * 0.10;

    return (wave1 * 0.70 + wave2 * 0.64 + wave3 * 0.42 + wave4 * 0.36 + swirl + ridge + 2.4) / 3.7;
  }

  function createTerrain(cols, rows, t) {
    return Array.from({ length: rows }, (_, y) => {
      return Array.from({ length: cols }, (_, x) => {
        const nx = x / Math.max(1, cols - 1);
        const ny = y / Math.max(1, rows - 1);
        return terrainField(nx, ny, t);
      });
    });
  }

  function interpolateEdge(edge, x, y, cellW, cellH, topLeft, topRight, bottomRight, bottomLeft, level) {
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const edgeValue = (a, b) => {
      if (Math.abs(a - b) < 0.0001) return 0.5;
      return clamp((level - a) / (b - a), 0, 1);
    };

    switch (edge) {
      case 0:
        return { x: x + cellW * edgeValue(topLeft, topRight), y };
      case 1:
        return { x: x + cellW, y: y + cellH * edgeValue(topRight, bottomRight) };
      case 2:
        return { x: x + cellW * edgeValue(bottomLeft, bottomRight), y: y + cellH };
      case 3:
        return { x, y: y + cellH * edgeValue(topLeft, bottomLeft) };
      default:
        return { x, y };
    }
  }

  function drawContours(level, terrain) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cols = terrain[0].length;
    const rows = terrain.length;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let y = 0; y < rows - 1; y += 1) {
      for (let x = 0; x < cols - 1; x += 1) {
        const topLeft = terrain[y][x];
        const topRight = terrain[y][x + 1];
        const bottomRight = terrain[y + 1][x + 1];
        const bottomLeft = terrain[y + 1][x];

        let caseIndex = 0;
        if (topLeft > level) caseIndex |= 1;
        if (topRight > level) caseIndex |= 2;
        if (bottomRight > level) caseIndex |= 4;
        if (bottomLeft > level) caseIndex |= 8;

        const segments = {
          0: [],
          1: [[3, 0]],
          2: [[0, 1]],
          3: [[3, 1]],
          4: [[1, 2]],
          5: [[3, 0], [1, 2]],
          6: [[0, 2]],
          7: [[3, 2]],
          8: [[3, 2]],
          9: [[0, 2]],
          10: [[3, 0], [1, 2]],
          11: [[1, 2]],
          12: [[3, 1]],
          13: [[0, 1]],
          14: [[3, 0]],
          15: []
        };

        (segments[caseIndex] || []).forEach(([startEdge, endEdge]) => {
          const start = interpolateEdge(startEdge, x * cellW, y * cellH, cellW, cellH, topLeft, topRight, bottomRight, bottomLeft, level);
          const end = interpolateEdge(endEdge, x * cellW, y * cellH, cellW, cellH, topLeft, topRight, bottomRight, bottomLeft, level);

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        });
      }
    }
  }

  function drawTerrain() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(width / cellSize) + 10;
    const rows = Math.ceil(height / cellSize) + 10;
    const terrain = createTerrain(cols, rows, animationTime);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    levels.forEach((level, index) => {
      const alpha = (index + 1) / levels.length * 0.75;
      ctx.strokeStyle = hexToRgba(contourBaseColor, alpha);
      ctx.lineWidth = index < 5 ? 0.8 : 0.6;
      drawContours(level, terrain);
    });
  }

  function animate() {
    animationTime += 0.00028;
    drawTerrain();
    requestAnimationFrame(animate);
  }

  drawTerrain();
  window.addEventListener('resize', drawTerrain);
  requestAnimationFrame(animate);
})();
