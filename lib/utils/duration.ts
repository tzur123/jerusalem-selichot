/** "MM:SS", or "H:MM:SS" once the tour runs past an hour. For the live ticking timer chip. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Friendly Hebrew phrase (e.g. "שעה ו-12 דקות") for the completion screen's summary stat. */
export function formatDurationHebrew(ms: number): string {
  const totalMinutes = Math.round(Math.max(0, ms) / 60000);
  if (totalMinutes < 1) return "פחות מדקה";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const minutesWord = minutes === 1 ? "דקה" : `${minutes} דקות`;

  if (hours === 0) return minutesWord;

  const hoursWord = hours === 1 ? "שעה" : hours === 2 ? "שעתיים" : `${hours} שעות`;
  return minutes === 0 ? hoursWord : `${hoursWord} ו-${minutesWord}`;
}
