"use client";

import { useEffect } from "react";
import { useSound } from "@/lib/sound/SoundProvider";

/** Plays the celebratory chime once when the completion screen mounts. */
export function SuccessChime() {
  const { playSuccess } = useSound();
  useEffect(() => {
    const id = setTimeout(() => playSuccess(), 250);
    return () => clearTimeout(id);
  }, [playSuccess]);
  return null;
}
