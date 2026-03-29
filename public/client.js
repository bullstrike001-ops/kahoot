/**
 * client.js — Shared Socket.IO client logic and utilities
 */

// ── Socket connection (lazy-initialized) ───────────────────────────────────
let socket = null;

function getSocket() {
  if (!socket) {
    socket = io();
  }
  return socket;
}

// ── Confetti animation ─────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1',
  '#ffffff', '#c8aaff',
];

function launchConfetti(container) {
  const count = 80;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    el.style.width = (8 + Math.random() * 10) + 'px';
    el.style.height = (8 + Math.random() * 10) + 'px';
    el.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.style.animationDelay = (Math.random() * 2) + 's';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(el);
  }
}

// ── Render player chip (main screen) ───────────────────────────────────────
function renderPlayerChip(player) {
  const chip = document.createElement('div');
  chip.className = 'player-chip';
  chip.dataset.id = player.id;
  chip.style.background = hexToRgba(player.color, 0.25);
  chip.style.color = '#fff';
  chip.style.borderColor = hexToRgba(player.color, 0.5);
  chip.innerHTML = `<span class="avatar">${escapeHtml(player.avatar)}</span><span>${escapeHtml(player.nickname)}</span>`;
  return chip;
}

// ── Render player row (host screen) ────────────────────────────────────────
function renderPlayerRow(player) {
  const row = document.createElement('div');
  row.className = 'host-player-row';
  row.dataset.id = player.id;
  const dot = document.createElement('div');
  dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${player.color};flex-shrink:0;`;
  row.innerHTML = `
    <div class="host-player-avatar">${escapeHtml(player.avatar)}</div>
    <div class="host-player-name">${escapeHtml(player.nickname)}</div>
  `;
  row.insertBefore(dot, row.firstChild);
  return row;
}

// ── Show countdown overlay ─────────────────────────────────────────────────
function showCountdown(value, overlayEl, numberEl) {
  overlayEl.classList.remove('hidden');
  setCountdownNumber(value, numberEl);
}

function setCountdownNumber(value, numberEl) {
  // Re-trigger animation by cloning
  const clone = numberEl.cloneNode(true);
  clone.textContent = value;
  numberEl.parentNode.replaceChild(clone, numberEl);
  return clone;
}

// ── Show reveal overlay ────────────────────────────────────────────────────
function showReveal(revealEl, confettiEl) {
  revealEl.classList.remove('hidden');
  launchConfetti(confettiEl);
}

// ── Utility: hex → rgba ────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Utility: escape HTML ───────────────────────────────────────────────────
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
}
