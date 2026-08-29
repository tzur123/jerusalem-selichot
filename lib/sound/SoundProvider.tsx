"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SoundContextValue = {
  muted: boolean;
  toggleMute: () => void;
  playClick: () => void;
  playSuccess: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "jslichot-muted";

// Gentle ambient chord progression (frequencies in Hz). Sine pads, low gain.
const CHORDS: number[][] = [
  [130.81, 164.81, 196.0], // C
  [110.0, 130.81, 164.81], // Am
  [87.31, 110.0, 130.81], // F
  [98.0, 123.47, 146.83], // G
];

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chordIndexRef = useRef(0);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();

      const music = ctx.createGain();
      music.gain.value = 0.06;
      music.connect(ctx.destination);

      const sfx = ctx.createGain();
      sfx.gain.value = 0.22;
      sfx.connect(ctx.destination);

      ctxRef.current = ctx;
      musicGainRef.current = music;
      sfxGainRef.current = sfx;
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playChord = useCallback(() => {
    const ctx = ctxRef.current;
    const out = musicGainRef.current;
    if (!ctx || !out || mutedRef.current) return;
    const now = ctx.currentTime;
    const chord = CHORDS[chordIndexRef.current % CHORDS.length];
    chordIndexRef.current += 1;

    for (const freq of chord) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.5, now + 2.2); // slow swell
      g.gain.linearRampToValueAtTime(0.0001, now + 6); // slow release
      osc.connect(g).connect(out);
      osc.start(now);
      osc.stop(now + 6.2);
    }
  }, []);

  const startMusic = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = ensureContext();
    if (!ctx) return;
    if (musicTimerRef.current) return;
    playChord();
    musicTimerRef.current = setInterval(playChord, 5500);
  }, [ensureContext, playChord]);

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current) {
      clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  }, []);

  const playClick = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = ensureContext();
    const out = sfxGainRef.current;
    if (!ctx || !out) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(940, now + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(g).connect(out);
    osc.start(now);
    osc.stop(now + 0.16);
  }, [ensureContext]);

  const playSuccess = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = ensureContext();
    const out = sfxGainRef.current;
    if (!ctx || !out) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.8, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 0.34);
    });
  }, [ensureContext]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage errors (private mode, etc.)
      }
      if (next) {
        stopMusic();
      } else {
        startMusic();
      }
      return next;
    });
  }, [startMusic, stopMusic]);

  // Restore mute preference.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "1") {
      mutedRef.current = true;
      // Defer so the first client render matches the server (muted=false),
      // avoiding both a hydration mismatch and a synchronous setState-in-effect.
      queueMicrotask(() => setMuted(true));
    }
  }, []);

  // Kick off audio + ambient music on the first user gesture (autoplay policy).
  useEffect(() => {
    const onFirstGesture = () => {
      ensureContext();
      if (!mutedRef.current) startMusic();
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [ensureContext, startMusic]);

  // Delegated click SFX for any button / link across the whole app.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest) return;
      const interactive = target.closest('button, a, [role="button"], summary');
      if (interactive) playClick();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [playClick]);

  // Pause the ambient loop when the tab is hidden; resume when visible.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopMusic();
      } else if (!mutedRef.current) {
        startMusic();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startMusic, stopMusic]);

  useEffect(() => () => stopMusic(), [stopMusic]);

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playClick, playSuccess }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      muted: false,
      toggleMute: () => {},
      playClick: () => {},
      playSuccess: () => {},
    };
  }
  return ctx;
}
