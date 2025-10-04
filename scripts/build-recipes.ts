import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Recipe = {
  title: string;
  time_minutes: number;
  serves: number;
  ingredients: { item: string; amount: number; unit: string }[];
  steps: string;
  tags: string[];
};

type RecipeIndexItem = {
  slug: string;
  title: string;
  time_minutes: number;
  serves: number;
  tags: string[];
};

const RECIPES_DIR = join(process.cwd(), "public", "recipes");
const OUT_FILE = join(RECIPES_DIR, "index.json");

function isRecipeFile(name: string) {
  return name.endsWith(".json") && name !== "index.json";
}

function slugOf(name: string) {
  return name.replace(/\.json$/i, "");
}

function main() {
  const files = readdirSync(RECIPES_DIR).filter(isRecipeFile);
  const index: RecipeIndexItem[] = [];

  for (const file of files) {
    const slug = slugOf(file);
    const full = join(RECIPES_DIR, file);
    const raw = readFileSync(full, "utf8");
    let data: Recipe;

    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error(`❌ Invalid JSON in ${file}:`, e);
      process.exitCode = 1;
      continue;
    }

    // Minimal validation
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
      tags: data.tags
    });
  }

  // Sort alphabetically by title (nice UX)
  index.sort((a, b) => a.title.localeCompare(b.title));

  writeFileSync(OUT_FILE, JSON.stringify(index, null, 2), "utf8");
  console.log(`✅ Wrote ${OUT_FILE} with ${index.length} recipes.`);
}

main();
