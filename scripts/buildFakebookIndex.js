const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "../FakeBookIndex");
const OUTPUT_DIR = path.join(__dirname, "../data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "fakebook-index.json");

function normalize(name) {
  return name
    .toLowerCase()
    // remove parenthetical junk
    .replace(/\(.*?\)/g, "")
    // remove common suffix noise
    .replace(/\b(all keys|bass|bb|eb|key of .*|in .*|version \d+|\d+)\b/g, "")
    // remove punctuation
    .replace(/[^\w\s]/g, "")
    // collapse spaces
    .replace(/\s+/g, " ")
    .trim();
}

function processFile(filePath, bookName, index) {
  const raw = fs.readFileSync(filePath, "utf-8");

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.warn(`Skipping invalid JSON: ${filePath}`);
    return;
  }

  if (!Array.isArray(data)) return;

  data.forEach((entry) => {
    const title = entry.Title || entry.title;
    const page = entry.Page || entry.page;

    if (!title || !page) return;

    const lowerTitle = title.toLowerCase();

    // Skip bass charts only
    if (/\bbass\b/.test(lowerTitle)) {
      return;
    }

    // Light cleanup BEFORE normalization
    const cleanedTitle = lowerTitle
      // remove parenthetical info
      .replace(/\(.*?\)/g, "")
      // remove common suffix noise
      .replace(/\b(all keys|key of .*|in .*|version \d+|\d+)\b/g, "")
      // collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    const key = normalize(cleanedTitle);

    if (!key) return;

    if (!index[key]) {
      index[key] = [];
    }

    index[key].push({
      book: bookName,
      page: page,
    });
  });
}

function walkDir(dir, index) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, index);
    } else if (file.endsWith(".json")) {
      const bookName = path.basename(file, ".json");
      processFile(fullPath, bookName, index);
    }
  });
}

function dedupe(index) {
  Object.keys(index).forEach((key) => {
    const seen = new Set();

    index[key] = index[key].filter((ref) => {
      const id = `${ref.book}-${ref.page}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });
}

function main() {
  const index = {};

  walkDir(INPUT_DIR, index);
  dedupe(index);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));

  console.log(`✅ Built index with ${Object.keys(index).length} tunes`);
}

main();