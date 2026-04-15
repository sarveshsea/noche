import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { __resetPackageRootCache, packagePath, packageRoot } from "../asset-path.js";

describe("asset-path", () => {
  afterEach(() => {
    __resetPackageRootCache();
    delete process.env.MEMOIRE_PACKAGE_ROOT;
  });

  it("resolves to the repo root in dev (contains package.json)", () => {
    const root = packageRoot();
    expect(existsSync(join(root, "package.json"))).toBe(true);
  });

  it("resolves to the repo root in dev (contains skills/registry.json)", () => {
    expect(existsSync(packagePath("skills", "registry.json"))).toBe(true);
  });

  it("honors MEMOIRE_PACKAGE_ROOT override", () => {
    process.env.MEMOIRE_PACKAGE_ROOT = "/tmp/custom-memoire-root";
    __resetPackageRootCache();
    expect(packageRoot()).toBe("/tmp/custom-memoire-root");
  });

  it("packagePath joins segments under the root", () => {
    const p = packagePath("a", "b", "c");
    expect(p.endsWith("a/b/c") || p.endsWith("a\\b\\c")).toBe(true);
  });
});
