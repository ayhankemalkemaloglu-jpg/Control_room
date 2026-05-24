// Copies non-TS assets (schema.sql) into dist/ after `tsc`, so the compiled
// migration runner can read the schema at runtime. Cross-platform.
const fs = require("node:fs");
const path = require("node:path");

const src = path.join(__dirname, "..", "src", "db", "schema.sql");
const destDir = path.join(__dirname, "..", "dist", "db");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, path.join(destDir, "schema.sql"));
console.log("[build] copied schema.sql -> dist/db/schema.sql");
