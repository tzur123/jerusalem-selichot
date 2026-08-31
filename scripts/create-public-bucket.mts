/**
 * Creates (or updates) the public "station-public" Supabase Storage bucket
 * used for admin-uploaded location "hero" images on /places/[slug].
 * Uses the Storage Admin API — no DB/DDL access needed.
 * Run with: npx tsx scripts/create-public-bucket.mts
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

const BUCKET_ID = "station-public";
const LIMIT_BYTES = 20 * 1024 * 1024; // 20 MiB

async function main() {
  const { data: existing } = await supabase.storage.getBucket(BUCKET_ID);

  if (!existing) {
    const { data, error } = await supabase.storage.createBucket(BUCKET_ID, {
      public: true,
      fileSizeLimit: LIMIT_BYTES,
    });
    if (error) {
      console.error("Failed to create bucket:", error.message);
      process.exit(1);
    }
    console.log("Created bucket:", data);
  } else {
    console.log("Bucket already exists:", existing);
    const { data, error } = await supabase.storage.updateBucket(BUCKET_ID, {
      public: true,
      fileSizeLimit: LIMIT_BYTES,
    });
    if (error) {
      console.error("Failed to update bucket:", error.message);
      process.exit(1);
    }
    console.log("Updated bucket:", data);
  }

  const { data: after } = await supabase.storage.getBucket(BUCKET_ID);
  console.log("Bucket config now:", after);
}

main();
