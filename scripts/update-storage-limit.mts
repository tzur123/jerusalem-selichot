/**
 * Raises the "station-videos" Supabase Storage bucket's file size limit to
 * 300MB using the Storage Admin API (no direct DB/DDL access needed).
 * Run with: npx tsx scripts/update-storage-limit.mts
 */
import { readFileSync } from "node:fs";
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

const BUCKET_ID = "station-videos";
const LIMIT_BYTES = 314572800; // 300 MiB

async function main() {
  const { data: existing, error: getErr } = await supabase.storage.getBucket(BUCKET_ID);
  if (getErr) {
    console.error(`Could not read bucket "${BUCKET_ID}":`, getErr.message);
    process.exit(1);
  }
  console.log("Current bucket config:", existing);

  const { data, error } = await supabase.storage.updateBucket(BUCKET_ID, {
    public: existing.public,
    fileSizeLimit: LIMIT_BYTES,
  });
  if (error) {
    console.error("Failed to update bucket:", error.message);
    process.exit(1);
  }
  console.log("Update response:", data);

  const { data: after } = await supabase.storage.getBucket(BUCKET_ID);
  console.log("Bucket config now:", after);
}

main();
