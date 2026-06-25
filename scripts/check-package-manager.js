#!/usr/bin/env node
// Fails install if a second lockfile is committed, since npm is the only supported package manager here.
const fs = require("fs");
const path = require("path");

const disallowed = ["pnpm-lock.yaml", "yarn.lock"];
const found = disallowed.filter((file) =>
  fs.existsSync(path.join(__dirname, "..", file))
);

if (found.length > 0) {
  console.error(
    `\nThis project uses npm only. Found disallowed lockfile(s): ${found.join(", ")}.\n` +
      "Delete them and use `npm install` / `npm ci` instead.\n"
  );
  process.exit(1);
}
