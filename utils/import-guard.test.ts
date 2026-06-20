import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const restrictedPackages = [
  "react-icons",
  "@hugeicons/react",
  "@hugeicons/core-free-icons",
];

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        getFilesRecursively(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe("Import Guard Tests", () => {
  it("should not contain imports from restricted icon packages", () => {
    const rootDir = path.resolve(__dirname, "..");
    const foldersToScan = ["app", "components"];
    const filesToScan: string[] = [];

    for (const folder of foldersToScan) {
      getFilesRecursively(path.join(rootDir, folder), filesToScan);
    }

    const violations: string[] = [];

    for (const file of filesToScan) {
      const content = fs.readFileSync(file, "utf8");

      for (const pkg of restrictedPackages) {
        // Regex to match imports from the restricted package
        const importRegex = new RegExp(`from\\s+['"]${pkg}(\\/.*)?['"]`, "g");
        if (importRegex.test(content)) {
          violations.push(
            `${path.relative(rootDir, file)} imports from "${pkg}"`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
