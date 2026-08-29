"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = {
      title: "סיור סליחות ירושלים",
      text: "השלמתי את סיור הסליחות הדיגיטלי בירושלים — 5 תחנות, סיפור אחד!",
      url: typeof window !== "undefined" ? window.location.origin : undefined,
    };

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url ?? ""}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // no-op
    }
  }

  return (
    <Button onClick={handleShare} variant="secondary" fullWidth>
      {copied ? "הועתק! שתפו עם חברים" : "שתפו את הסיור"}
    </Button>
  );
}
