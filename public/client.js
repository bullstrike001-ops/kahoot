/**
 * client.js — shared Socket.IO helper utilities
 * Used across index.html, join.html, and host.html
 */

/**
 * Start a confetti animation on a canvas element.
 * @param {HTMLCanvasElement} canvas
 */
function startConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#ff6b35','#ffe400','#46178f','#1368ce','#e21b3c','#26890c','#f7c59f','#88d8b0','#fff'];
  const PIECES = 180;
  const particles = [];

  for (let i = 0; i < PIECES; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 9 + 4,
      d: Math.random() * PIECES,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.07 + 0.05,
    });
  }

  let animId;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    update();
    animId = requestAnimationFrame(draw);
  }

  function update() {
    particles.forEach((p, i) => {
      p.tiltAngle += p.tiltAngleInc;
      p.y += (Math.cos(p.d) + 2 + p.r / 2) * 0.6;
      p.x += Math.sin(i);
      p.tilt = Math.sin(p.tiltAngle) * 15;
      if (p.y > canvas.height) {
        p.x = Math.random() * canvas.width;
        p.y = -10;
      }
    });
  }

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  draw();
  return () => cancelAnimationFrame(animId);
}

/**
 * Show the countdown overlay and update the number.
 * @param {HTMLElement} overlay
 * @param {HTMLElement} numberEl
 * @param {number} value
 */
function showCountdownOverlay(overlay, numberEl, value) {
  numberEl.textContent = value;
  overlay.classList.add('active');
}

/**
 * Hide an overlay element.
 * @param {HTMLElement} overlay
 */
function hideOverlay(overlay) {
  overlay.classList.remove('active');
}

/**
 * Show the reveal overlay and fire confetti.
 * @param {HTMLElement} overlay
 * @param {HTMLCanvasElement} canvas
 */
function showRevealOverlay(overlay, canvas) {
  overlay.classList.add('active');
  startConfetti(canvas);
}
