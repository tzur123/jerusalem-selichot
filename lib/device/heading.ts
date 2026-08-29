"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/**
 * Compass heading (0-360, 0 = north) from DeviceOrientation, used as a
 * fallback when GPS-derived heading is unavailable (user stationary).
 * Navigation never depends on this being available — it's a pure enhancement.
 */
export function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [supported] = useState(() => typeof window !== "undefined" && "DeviceOrientationEvent" in window);
  const listening = useRef(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const webkitEvent = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
    if (typeof webkitEvent.webkitCompassHeading === "number") {
      setHeading(webkitEvent.webkitCompassHeading);
    } else if (typeof event.alpha === "number") {
      setHeading(360 - event.alpha);
    }
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    const DOE = DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;

    try {
      if (typeof DOE.requestPermission === "function") {
        const result = await DOE.requestPermission();
        if (result !== "granted") return;
      }
      if (!listening.current) {
        window.addEventListener("deviceorientation", handleOrientation, true);
        listening.current = true;
      }
    } catch {
      // Unsupported / denied — navigation continues without compass rotation.
    }
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      if (listening.current && typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, [handleOrientation]);

  return { heading, supported, enable };
}
