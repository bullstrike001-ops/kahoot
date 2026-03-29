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
    waiting:    'https://cdn.pixabay.com/audio/2022/10/25/audio_946b6cedc3.mp3', // Lofi Ambient Game Background (Pixabay)
    aprilFools: 'https://cdn.pixabay.com/audio/2024/08/14/audio_9f4515bf2d.mp3', // Funny Trumpet Tune 15s (Pixabay #232408)
    laugh:      'https://cdn.pixabay.com/audio/2022/03/15/audio_115bfa4c7f.mp3'  // Maniacal Laughter (Pixabay #177313)
  };

  const VOLUMES = { waiting: 0.4, aprilFools: 0.8, laugh: 0.8 };
  const BEEP_VOLUME = 0.7;

  const sounds = {};

  // ── Shared Web Audio context ──────────────────────────────────────────────

  let _audioCtx = null;
  function _getAudioCtx() {
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

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

  /** Play one countdown beep (stops waiting music on first call). Synthesised via Web Audio API. */
  function playCountdownBeep() {
    stopWaiting();
    if (muted) return;
    try {
      const ctx = _getAudioCtx();
      const vol = BEEP_VOLUME;
      // First tone: sharp high sweep (sci-fi descending)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1400, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      gain1.gain.setValueAtTime(vol, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      // Second tone: lower echo note
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(700, ctx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.55);
      gain2.gain.setValueAtTime(vol * 0.6, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) { /* Web Audio API unavailable */ }
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
