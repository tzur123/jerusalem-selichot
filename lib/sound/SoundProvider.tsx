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

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();

      const sfx = ctx.createGain();
      sfx.gain.value = 0.22;
      sfx.connect(ctx.destination);

      ctxRef.current = ctx;
      sfxGainRef.current = sfx;
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // A soft, playful two-tone "bubble pop" — friendlier than a sharp UI click.
  const playClick = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = ensureContext();
    const out = sfxGainRef.current;
    if (!ctx || !out) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.55, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    osc.connect(g).connect(out);
    osc.start(now);
    osc.stop(now + 0.18);

    const sparkle = ctx.createOscillator();
    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(1320, now);
    sparkle.frequency.exponentialRampToValueAtTime(1040, now + 0.07);
    const gs = ctx.createGain();
    gs.gain.setValueAtTime(0.0001, now);
    gs.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
    gs.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    sparkle.connect(gs).connect(out);
    sparkle.start(now);
    sparkle.stop(now + 0.1);
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
      return next;
    });
  }, []);

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

  // Unlock the AudioContext on the first user gesture (autoplay policy).
  useEffect(() => {
    const onFirstGesture = () => ensureContext();
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [ensureContext]);

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
