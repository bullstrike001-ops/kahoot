/**
 * QuizBlitz – Audio System
 * Manages all audio playback for different game phases.
 * Handles mobile browser restrictions by deferring playback until user interaction.
 */

const AudioManager = (() => {
  let muted = false;
  let userInteracted = false;
  let pendingWaiting = false;

  const SOURCES = {
    waiting:    'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3',
    beep:       'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-click-900.wav',
    aprilFools: 'https://assets.mixkit.co/sfx/preview/mixkit-cartoon-sad-trumpet-558.wav',
    laugh:      'https://assets.mixkit.co/sfx/preview/mixkit-strange-voice-laugh-2032.wav'
  };

  const VOLUMES = { waiting: 0.4, beep: 0.6, aprilFools: 0.8, laugh: 0.8 };

  const sounds = {};

  // ── Preload ───────────────────────────────────────────────────────────────

  function preload() {
    for (const [key, url] of Object.entries(SOURCES)) {
      const audio = new window.Audio();
      audio.preload = 'auto';
      audio.volume  = VOLUMES[key] ?? 0.6;
      if (key === 'waiting') audio.loop = true;
      audio.src = url;
      sounds[key] = audio;
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _play(key) {
    const audio = sounds[key];
    if (!audio || muted) return;
    audio.currentTime = 0;
    audio.play().catch(() => { /* browser may block until user interaction */ });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Start looping waiting music. Deferred on mobile until first user gesture. */
  function playWaiting() {
    if (!userInteracted) {
      pendingWaiting = true;
      return;
    }
    _play('waiting');
  }

  /** Stop (and rewind) waiting music. */
  function stopWaiting() {
    pendingWaiting = false;
    const audio = sounds.waiting;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  /** Play one countdown beep (stops waiting music on first call). */
  function playCountdownBeep() {
    stopWaiting();
    _play('beep');
  }

  /** Play the April Fools reveal sound combo (trombone + laugh). */
  function playAprilFools() {
    stopAll();
    _play('aprilFools');
    // Stagger the laugh 2 s after the trombone
    setTimeout(() => _play('laugh'), 2000);
  }

  /** Pause and rewind every sound. */
  function stopAll() {
    pendingWaiting = false;
    for (const audio of Object.values(sounds)) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Toggle mute state.
   * @returns {boolean} true when now muted, false when unmuted.
   */
  function toggleMute() {
    muted = !muted;
    if (muted) {
      for (const audio of Object.values(sounds)) audio.pause();
    } else if (pendingWaiting) {
      pendingWaiting = false;
      _play('waiting');
    }
    return muted;
  }

  // ── Mobile / first-interaction unlock ────────────────────────────────────

  function _onInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    if (pendingWaiting && !muted) {
      pendingWaiting = false;
      _play('waiting');
    }
  }

  ['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, _onInteraction, { once: true, passive: true });
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  preload();

  return { playWaiting, stopWaiting, playCountdownBeep, playAprilFools, stopAll, toggleMute };
})();
