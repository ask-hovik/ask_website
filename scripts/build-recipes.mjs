import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RECIPES_DIR = join(process.cwd(), "public", "recipes");
const OUT_FILE = join(RECIPES_DIR, "index.json");

function isRecipeFile(name) {
  return name.endsWith(".json") && name !== "index.json";
}
function slugOf(name) {
  return name.replace(/\.json$/i, "");
}

function main() {
  if (!existsSync(RECIPES_DIR)) mkdirSync(RECIPES_DIR, { recursive: true });
  const files = readdirSync(RECIPES_DIR).filter(isRecipeFile);

  /** @type {Array<{slug:string,title:string,time_minutes:number,serves:number,tags:string[]}>} */
  const index = [];

  for (const file of files) {
    const slug = slugOf(file);
    const full = join(RECIPES_DIR, file);
    let data;

    try {
      data = JSON.parse(readFileSync(full, "utf8"));
    } catch (e) {
      console.error(`❌ Invalid JSON in ${file}:`, e);
      process.exitCode = 1;
      continue;
    }

    if (
      !data.title ||
      typeof data.time_minutes !== "number" ||
      typeof data.serves !== "number" ||
      !Array.isArray(data.tags)
    ) {
      console.error(`❌ Missing required fields in ${file}`);
      process.exitCode = 1;
      continue;
    }

    index.push({
      slug,
      title: data.title,
      time_minutes: data.time_minutes,
      serves: data.serves,
      tags: data.tags,
    });
  }

  index.sort((a, b) => a.title.localeCompare(b.title));
  writeFileSync(OUT_FILE, JSON.stringify(index, null, 2), "utf8");
  console.log(`✅ Wrote ${OUT_FILE} with ${index.length} recipes.`);
}

main();
