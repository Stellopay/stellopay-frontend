const fs = require('fs');
const path = require('path');

const BUDGETS = {
  '/': 225, // kB
  '/dashboard': 180, // kB
};

function parseSize(sizeStr) {
  const match = sizeStr.match(/(\d+(\.\d+)?)\s*(kB|B|mB)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[3].toLowerCase();
  if (unit === 'b') return value / 1024;
  if (unit === 'mb') return value * 1024;
  return value;
}

function checkBundleSize() {
  const buildOutputPath = process.argv[2];
  if (!buildOutputPath) {
    console.error('Usage: node scripts/check-bundle-size.js <build-output-file>');
    process.exit(1);
  }

  const content = fs.readFileSync(buildOutputPath, 'utf8');
  const lines = content.split('\n');

  let success = true;
  const found = new Set();

  for (const line of lines) {
    // Next.js build output format for routes:
    // ├ ○ /route-path      Size  First Load JS
    // We look for the route path and the last two columns.

    for (const route in BUDGETS) {
      // Regex to match the route line.
      // It usually starts with some tree markers (┌, ├, └, │) and then the route.
      // Then some spaces, then the Size, then some more spaces, then First Load JS.
      // Example: ┌ ○ /                                    12.3 kB         213 kB
      // Example: ├ ○ /dashboard                           5.97 kB         165 kB

      const routeRegex = new RegExp(`[┌├└│]\\s*[○ƒ]\\s*${route.replace(/\//g, '\\/')}\\s+([\\d.]+\\s*\\w+)\\s+([\\d.]+\\s*\\w+)`);
      const match = line.match(routeRegex);

      if (match) {
        const firstLoadJS = parseSize(match[2]);
        const budget = BUDGETS[route];
        found.add(route);

        if (firstLoadJS > budget) {
          console.error(`❌ Budget exceeded for ${route}: ${firstLoadJS.toFixed(2)} kB > ${budget} kB`);
          success = false;
        } else {
          console.log(`✅ ${route}: ${firstLoadJS.toFixed(2)} kB (Budget: ${budget} kB)`);
        }
      }
    }
  }

  for (const route in BUDGETS) {
    if (!found.has(route)) {
      console.error(`❌ Could not find build output for route: ${route}`);
      success = false;
    }
  }

  if (!success) {
    process.exit(1);
  }
}

checkBundleSize();
