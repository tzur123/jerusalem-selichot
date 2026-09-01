/**
 * Diagnostic: for every station, print hero_image_path/poster_path from the
 * DB and whether the corresponding object actually exists in storage.
 * Run with: npx tsx scripts/diagnose-hero-images.mts
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

async function main() {
  const { data: stations, error } = await supabase
    .from("stations")
    .select("id, slug, name, order_index, hero_image_path, poster_path, video_path")
    .order("order_index", { ascending: true });

  if (error || !stations) {
    console.error("Failed to fetch stations:", error?.message);
    process.exit(1);
  }

  const { data: publicList, error: publicListErr } = await supabase.storage.from("station-public").list("", { limit: 200 });
  console.log("=== station-public bucket root listing ===");
  if (publicListErr) console.log("  error:", publicListErr.message);
  else console.log(publicList?.map((f) => f.name));

  for (const s of stations) {
    console.log(`\n--- #${s.order_index} ${s.name} (${s.slug}) ---`);
    console.log("  hero_image_path:", s.hero_image_path);
    console.log("  poster_path:", s.poster_path);
    console.log("  video_path:", s.video_path);

    if (s.hero_image_path) {
      const dir = s.hero_image_path.split("/").slice(0, -1).join("/");
      const { data: list, error: listErr } = await supabase.storage.from("station-public").list(dir, { limit: 50 });
      const fileName = s.hero_image_path.split("/").pop();
      const found = list?.find((f) => f.name === fileName);
      console.log("  hero object exists in storage:", !!found, listErr ? `(list error: ${listErr.message})` : "");
    }
  }
}

main();
