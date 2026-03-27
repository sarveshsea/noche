import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { installNote, getNoteInfo } from "../index.js";

let projectRoot: string;
let sourceDir: string;

beforeEach(async () => {
  projectRoot = join(tmpdir(), `memoire-note-install-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  sourceDir = join(projectRoot, "clawhub-mobile-craft");
  await mkdir(sourceDir, { recursive: true });
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe("installNote", () => {
  it("installs a SKILL.md-only bundle and synthesizes a memoire manifest", async () => {
    await writeFile(
      join(sourceDir, "SKILL.md"),
      `---
name: clawhub-mobile-craft
category: craft
activateOn: design-creation
freedomLevel: high
description: Mobile-first guidance for AgentSkills workspaces.
tags: [mobile, ui]
dependencies: [figma-use]
---

# ClawHub Mobile Craft

Workspace skill body.
`,
      "utf-8",
    );

    const manifest = await installNote(sourceDir, projectRoot);
    const installedDir = join(projectRoot, ".memoire", "notes", "clawhub-mobile-craft");
    const expectedManifest = {
      name: "clawhub-mobile-craft",
      version: "0.1.0",
      description: "Mobile-first guidance for AgentSkills workspaces.",
      category: "craft",
      tags: ["mobile", "ui"],
      dependencies: ["figma-use"],
      skills: [{
        file: "SKILL.md",
        name: "Clawhub Mobile Craft",
        activateOn: "design-creation",
        freedomLevel: "high",
      }],
    };

    expect(manifest).toMatchObject(expectedManifest);

    const installedManifest = JSON.parse(await readFile(join(installedDir, "note.json"), "utf-8"));
    expect(installedManifest).toMatchObject(expectedManifest);
    expect(await readFile(join(installedDir, "SKILL.md"), "utf-8")).toContain("Workspace skill body.");

    const info = await getNoteInfo("clawhub-mobile-craft", projectRoot);
    expect(info).toMatchObject(expectedManifest);
  });
});
