import { describe, it, expect } from "vitest";
import { parseSkillMarkdown, buildWorkspaceSkillNote } from "../frontmatter.js";

describe("parseSkillMarkdown", () => {
  it("parses nested frontmatter and block scalars", () => {
    const markdown = `---
skill: Design Systems
category: craft
activateOn: component-creation
freedomLevel: high
description: >
  Deep knowledge base for design system architecture,
  token taxonomy, component API design, and governance.
metadata:
  tags: [design-systems, tokens]
  dependencies: [figma-use, atomic-design]
---

# Design Systems

This is the body.
`;

    const parsed = parseSkillMarkdown(markdown);
    expect(parsed.frontmatter.skill).toBe("Design Systems");
    expect(parsed.frontmatter.category).toBe("craft");
    expect(parsed.frontmatter.metadata).toEqual({
      tags: ["design-systems", "tokens"],
      dependencies: ["figma-use", "atomic-design"],
    });
    expect(parsed.body).toContain("# Design Systems");
    expect(parsed.frontmatter.description).toContain("design system architecture");
  });

  it("builds a Memoire-compatible note with sensible defaults", () => {
    const markdown = `---
name: mobile-craft
---

# Mobile Craft

Mobile-first guidance.
`;

    const note = buildWorkspaceSkillNote(markdown, {
      noteDir: "/tmp/skills/mobile-craft",
      fallbackName: "mobile-craft",
      skillFileName: "SKILL.md",
    });

    expect(note.manifest.name).toBe("mobile-craft");
    expect(note.manifest.version).toBe("0.1.0");
    expect(note.manifest.category).toBe("craft");
    expect(note.manifest.skills[0]).toMatchObject({
      file: "SKILL.md",
      name: "Mobile Craft",
      activateOn: "design-creation",
      freedomLevel: "high",
    });
    expect(note.manifest.description).toBe("Mobile Craft");
    expect(note.path).toBe("/tmp/skills/mobile-craft");
    expect(note.builtIn).toBe(false);
    expect(note.enabled).toBe(true);
  });

  it("honors metadata.memoire overrides from inline JSON frontmatter", () => {
    const markdown = `---
name: review-skill
description: Review-only workflow
disable-model-invocation: true
metadata: {"memoire":{"category":"connect","activateOn":"design-review","freedomLevel":"read-only","tags":["audit"],"dependencies":["figma-use"]}}
---

Read-only review body.
`;

    const note = buildWorkspaceSkillNote(markdown, {
      noteDir: "/tmp/skills/review-skill",
      fallbackName: "review-skill",
      skillFileName: "SKILL.md",
    });

    expect(note.manifest.category).toBe("connect");
    expect(note.manifest.skills[0]).toMatchObject({
      activateOn: "design-review",
      freedomLevel: "read-only",
    });
    expect(note.manifest.tags).toEqual(["audit"]);
    expect(note.manifest.dependencies).toEqual(["figma-use"]);
  });
});
