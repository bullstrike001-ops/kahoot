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
  waiting:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  beep:       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  aprilFools: 'https://cdn.pixabay.com/audio/2024/08/14/audio_9f4515bf2d.mp3',
  laugh:      'https://cdn.pixabay.com/audio/2022/03/15/audio_115bfa4c7f.mp3'
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
  // Redă de 3 ori cu pauze
  setTimeout(() => _play('aprilFools'), 13000);
  setTimeout(() => _play('aprilFools'), 26000);
  // Laugh după ultima replicare
  setTimeout(() => _play('laugh'), 39000);
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
