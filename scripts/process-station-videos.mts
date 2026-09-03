/**
 * One-off pipeline: takes the 5 raw 4K station-narration videos the client
 * dropped in Downloads, transcodes each to a web-friendly, iOS/Android-safe
 * H.264 + AAC MP4 (two-pass, sized to stay under Supabase's real-world
 * per-file upload ceiling), uploads it to the private `station-videos`
 * bucket, and writes the resulting object key onto `stations.video_path`.
 *
 * Run with: npx tsx scripts/process-station-videos.mts
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
// @ts-expect-error - no types package, path lookup only
import ffprobeStatic from "ffprobe-static";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DOWNLOADS = "C:\\Users\\t\\Downloads";
const OUT_DIR = path.join(os.tmpdir(), "selichot-video-encode");
mkdirSync(OUT_DIR, { recursive: true });

// Stay safely under Supabase's real-world 50MB-per-file ceiling (the
// project's bucket is configured for 300MB, but the platform-wide "Global
// file size limit" setting still caps individual uploads well below that
// unless/until the project is on a paid plan with that setting raised).
const TARGET_BYTES = 44 * 1024 * 1024;
const AUDIO_KBPS = 96;

const JOBS: { file: string; slug: string; stationId: string; label: string }[] = [
  { file: "הרב קוק - רוחבי.mp4", slug: "beit-harav-kook", stationId: "00000000-0000-4000-8000-000000000001", label: "בית הרב קוק" },
  { file: "שער יפו - רוחבי.mp4", slug: "shaar-yafo", stationId: "00000000-0000-4000-8000-000000000003", label: "שער יפו" },
  { file: "חורבה סופי.mp4", slug: "beit-knesset-hachurva", stationId: "00000000-0000-4000-8000-000000000002", label: "בית הכנסת החורבה" },
  { file: "בית אורות - רוחבי.mp4", slug: "beit-orot", stationId: "00000000-0000-4000-8000-000000000004", label: "בית אורות" },
  { file: "הכותל - רוחבי.mp4", slug: "hakotel-hamaaravi", stationId: "00000000-0000-4000-8000-000000000005", label: "הכותל המערבי" },
];

function ffprobeDuration(inputPath: string): number {
  const ffprobeBin: string = ffprobeStatic.path;
  const out = execFileSync(ffprobeBin, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]).toString().trim();
  return parseFloat(out);
}

function transcode(inputPath: string, outputPath: string, slug: string): void {
  const durationSec = ffprobeDuration(inputPath);
  const totalKbps = Math.floor((TARGET_BYTES * 8) / durationSec / 1000);
  const videoKbps = Math.max(700, totalKbps - AUDIO_KBPS);
  const passLogFile = path.join(OUT_DIR, `${slug}-2pass`);

  console.log(`\n[${slug}] duration=${durationSec.toFixed(1)}s target=${(TARGET_BYTES / 1024 / 1024).toFixed(1)}MB video=${videoKbps}kbps audio=${AUDIO_KBPS}kbps`);

  const bin = ffmpegPath as string;
  const commonVideoArgs = [
    "-vf", "scale=1280:720",
    "-c:v", "libx264",
    "-profile:v", "main",
    "-level:v", "4.0",
    "-pix_fmt", "yuv420p",
    "-b:v", `${videoKbps}k`,
    "-maxrate", `${Math.round(videoKbps * 1.3)}k`,
    "-bufsize", `${Math.round(videoKbps * 2)}k`,
    "-threads", "0",
  ];

  console.log(`[${slug}] pass 1/2...`);
  execFileSync(bin, [
    "-y", "-i", inputPath,
    ...commonVideoArgs,
    // Must match pass 2's preset — mixing presets changes x264's implicit
    // weightp setting, which makes it reject the pass-1 stats file outright.
    "-preset", "medium",
    "-pass", "1",
    "-passlogfile", passLogFile,
    "-an",
    "-f", "mp4",
    process.platform === "win32" ? "NUL" : "/dev/null",
  ], { stdio: "inherit" });

  console.log(`[${slug}] pass 2/2...`);
  execFileSync(bin, [
    "-y", "-i", inputPath,
    ...commonVideoArgs,
    "-preset", "medium",
    "-pass", "2",
    "-passlogfile", passLogFile,
    "-c:a", "aac",
    "-b:a", `${AUDIO_KBPS}k`,
    "-ac", "2",
    "-ar", "44100",
    "-movflags", "+faststart",
    outputPath,
  ], { stdio: "inherit" });
}

async function uploadAndAttach(outputPath: string, stationId: string, slug: string): Promise<void> {
  const size = statSync(outputPath).size;
  console.log(`[${slug}] encoded size: ${(size / 1024 / 1024).toFixed(1)}MB — uploading...`);

  const objectPath = `${stationId}/video-${Date.now()}-${slug}.mp4`;
  const buffer = readFileSync(outputPath);

  const { error: upErr } = await supabase.storage.from("station-videos").upload(objectPath, buffer, {
    contentType: "video/mp4",
    upsert: true,
  });
  if (upErr) {
    console.error(`[${slug}] UPLOAD FAILED:`, upErr.message);
    return;
  }

  const { error: dbErr } = await supabase.from("stations").update({ video_path: objectPath }).eq("id", stationId);
  if (dbErr) {
    console.error(`[${slug}] DB UPDATE FAILED:`, dbErr.message);
    return;
  }

  console.log(`[${slug}] done — video_path = ${objectPath}`);
}

async function main() {
  for (const job of JOBS) {
    const inputPath = path.join(DOWNLOADS, job.file);
    if (!existsSync(inputPath)) {
      console.error(`[${job.slug}] MISSING SOURCE FILE: ${inputPath}`);
      continue;
    }
    const outputPath = path.join(OUT_DIR, `${job.slug}.mp4`);
    transcode(inputPath, outputPath, job.slug);
    await uploadAndAttach(outputPath, job.stationId, job.slug);
  }
  console.log("\nAll done.");
}

main();
