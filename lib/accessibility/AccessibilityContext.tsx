"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "a11y-settings-v1";

/** Font-size multipliers a visitor can step through, largest step ~60% bigger. */
export const FONT_STEPS = [1, 1.15, 1.3, 1.45, 1.6] as const;

export type A11yToggleKey =
  | "highContrast"
  | "grayscale"
  | "underlineLinks"
  | "readableFont"
  | "reduceMotion"
  | "bigCursor"
  | "strongFocus"
  | "textSpacing";

type A11ySettings = { fontStep: number } & Record<A11yToggleKey, boolean>;

const DEFAULT_SETTINGS: A11ySettings = {
  fontStep: 0,
  highContrast: false,
  grayscale: false,
  underlineLinks: false,
  readableFont: false,
  reduceMotion: false,
  bigCursor: false,
  strongFocus: false,
  textSpacing: false,
};

function loadSettings(): A11ySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<A11ySettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Mirrors settings onto <html> as classes/a CSS var — see the a11y rules in globals.css. */
function applyToDocument(settings: A11ySettings) {
  const root = document.documentElement;
  root.style.setProperty("--a11y-font-scale", String(FONT_STEPS[settings.fontStep] ?? 1));
  root.classList.toggle("a11y-contrast", settings.highContrast);
  root.classList.toggle("a11y-grayscale", settings.grayscale);
  root.classList.toggle("a11y-underline", settings.underlineLinks);
  root.classList.toggle("a11y-readable-font", settings.readableFont);
  root.classList.toggle("a11y-reduce-motion", settings.reduceMotion);
  root.classList.toggle("a11y-big-cursor", settings.bigCursor);
  root.classList.toggle("a11y-strong-focus", settings.strongFocus);
  root.classList.toggle("a11y-text-spacing", settings.textSpacing);
}

type A11yContextValue = {
  settings: A11ySettings;
  fontStepCount: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  toggle: (key: A11yToggleKey) => void;
  reset: () => void;
};

const A11yContext = createContext<A11yContextValue | null>(null);

/**
 * Global accessibility preferences (text size, contrast, motion, etc), applied
 * as classes on <html> and persisted to localStorage so they hold across
 * every page and future visits. Pairs with an inline pre-hydration script in
 * the root layout that applies the saved classes before first paint, so
 * there's no flash of un-adjusted content for a returning visitor.
 */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(() => loadSettings());

  useEffect(() => {
    applyToDocument(settings);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage unavailable (private browsing, quota, etc) — just won't persist.
    }
  }, [settings]);

  const increaseFont = useCallback(() => {
    setSettings((s) => ({ ...s, fontStep: Math.min(s.fontStep + 1, FONT_STEPS.length - 1) }));
  }, []);
  const decreaseFont = useCallback(() => {
    setSettings((s) => ({ ...s, fontStep: Math.max(s.fontStep - 1, 0) }));
  }, []);
  const toggle = useCallback((key: A11yToggleKey) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }, []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo<A11yContextValue>(
    () => ({ settings, fontStepCount: FONT_STEPS.length, increaseFont, decreaseFont, toggle, reset }),
    [settings, increaseFont, decreaseFont, toggle, reset]
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}

/** Inlined verbatim into a <script> tag in the root layout — keep it dependency-free. */
export const A11Y_BOOT_SCRIPT = `(function(){try{
  var s = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}");
  var r = document.documentElement;
  r.style.setProperty("--a11y-font-scale", String([${FONT_STEPS.join(",")}][s.fontStep] || 1));
  if (s.highContrast) r.classList.add("a11y-contrast");
  if (s.grayscale) r.classList.add("a11y-grayscale");
  if (s.underlineLinks) r.classList.add("a11y-underline");
  if (s.readableFont) r.classList.add("a11y-readable-font");
  if (s.reduceMotion) r.classList.add("a11y-reduce-motion");
  if (s.bigCursor) r.classList.add("a11y-big-cursor");
  if (s.strongFocus) r.classList.add("a11y-strong-focus");
  if (s.textSpacing) r.classList.add("a11y-text-spacing");
} catch (e) {}})();`;
