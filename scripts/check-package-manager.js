#!/usr/bin/env node
// Fails install if the Node or package-manager setup is unsupported.
const fs = require("fs");
const path = require("path");

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

// Supports the simple ">=x.y.z" ranges used by this repository.
function isNodeVersionSatisfied(nodeVersion, requiredRange) {
  const current = parseVersion(nodeVersion);
  const match = /^>=\s*(\d+)\.(\d+)\.(\d+)$/.exec(requiredRange);
  if (!current || !match) return false;

  const required = match.slice(1).map(Number);
  return compareVersions(current, required) >= 0;
}

function checkPackageManager({
  nodeVersion = process.versions.node,
  requiredRange = require(path.join(__dirname, "..", "package.json")).engines.node,
  rootDir = path.join(__dirname, ".."),
} = {}) {
  const disallowed = ["pnpm-lock.yaml", "yarn.lock"];
  const found = disallowed.filter((file) => fs.existsSync(path.join(rootDir, file)));

  if (!isNodeVersionSatisfied(nodeVersion, requiredRange)) {
    console.error(
      `Unsupported Node.js version ${nodeVersion}. This project requires Node.js ${requiredRange}. ` +
        "Please use Node.js 20.9.0 or newer (or run `nvm use`).\n",
    );
    return false;
  }

  if (found.length > 0) {
    console.error(
      `\nThis project uses npm only. Found disallowed lockfile(s): ${found.join(
        ", ",
      )}.\n` + "Delete them and use `npm install` / `npm ci` instead.\n",
    );
    return false;
  }

  return true;
}

module.exports = { isNodeVersionSatisfied, checkPackageManager };

if (require.main === module && !checkPackageManager()) {
  process.exit(1);
}
