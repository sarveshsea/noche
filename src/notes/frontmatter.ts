/**
 * Frontmatter parsing for workspace skill files.
 *
 * Supports a practical subset of YAML frontmatter used by AgentSkills / ClawHub:
 * - top-level scalar fields
 * - nested maps via indentation
 * - inline arrays
 * - folded/literal block scalars (`>` and `|`)
 */

import type { InstalledNote, NoteCategory, NoteManifest, FreedomLevel } from "./types.js";
import { NoteManifestSchema } from "./types.js";

export interface SkillMarkdownParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface WorkspaceSkillNoteOptions {
  noteDir: string;
  fallbackName: string;
  skillFileName?: string;
}

const VALID_CATEGORIES: NoteCategory[] = ["craft", "research", "connect", "generate"];
const VALID_FREEDOM_LEVELS: FreedomLevel[] = ["maximum", "high", "read-only", "reference"];

export function parseSkillMarkdown(markdown: string): SkillMarkdownParseResult {
  const text = markdown.replace(/^\uFEFF/, "");
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: markdown };
  }

  const frontmatter = parseFrontmatterBlock(match[1]);
  return { frontmatter, body: match[2] ?? "" };
}

export function buildWorkspaceSkillNote(
  markdown: string,
  options: WorkspaceSkillNoteOptions,
): InstalledNote {
  const parsed = parseSkillMarkdown(markdown);
  const manifest = workspaceFrontmatterToManifest(parsed.frontmatter, parsed.body, options);

  return {
    manifest,
    path: options.noteDir,
    builtIn: false,
    enabled: true,
  };
}

function workspaceFrontmatterToManifest(
  frontmatter: Record<string, unknown>,
  body: string,
  options: WorkspaceSkillNoteOptions,
): NoteManifest {
  const metadata = asRecord(frontmatter.metadata);
  const memoireMetadata = asRecord(metadata?.memoire);
  const rawName = firstString(
    frontmatter.name,
    frontmatter.skill,
    frontmatter.title,
    memoireMetadata?.name,
    metadata?.name,
    metadata?.skill,
  );

  const displayName = normalizeDisplayName(rawName ?? options.fallbackName);
  const manifestName = slugify(rawName ?? options.fallbackName);

  const category = normalizeCategory(
    firstString(frontmatter.category, memoireMetadata?.category, metadata?.category),
    `${displayName} ${body}`,
  );

  const activateOn = normalizeActivateOn(
    firstString(frontmatter.activateOn, memoireMetadata?.activateOn, metadata?.activateOn),
    category,
    `${displayName} ${body}`,
  );

  const freedomLevel = normalizeFreedomLevel(
    firstString(frontmatter.freedomLevel, memoireMetadata?.freedomLevel, metadata?.freedomLevel),
    `${displayName} ${body}`,
    frontmatter["disable-model-invocation"] === true,
  );

  const description = firstString(
    frontmatter.description,
    metadata?.description,
    extractFirstMeaningfulBodyLine(body),
    displayName,
  ) ?? `${displayName} workspace skill`;

  const tags = normalizeStringArray(
    frontmatter.tags,
    memoireMetadata?.tags,
    metadata?.tags,
  );

  const dependencies = normalizeStringArray(
    frontmatter.dependencies,
    memoireMetadata?.dependencies,
    metadata?.dependencies,
  );

  const version = firstString(frontmatter.version, memoireMetadata?.version, metadata?.version) ?? "0.1.0";
  const author = firstString(frontmatter.author, metadata?.author);
  const skillFileName = options.skillFileName ?? "SKILL.md";

  return NoteManifestSchema.parse({
    name: manifestName,
    version,
    description,
    author,
    category,
    tags,
    skills: [{
      file: skillFileName,
      name: displayName,
      activateOn,
      freedomLevel,
    }],
    dependencies,
    engines: normalizeEngines(firstRecord(frontmatter.engines, memoireMetadata?.engines, metadata?.engines)),
  });
}

function normalizeEngines(value: Record<string, unknown> | undefined): { memoire?: string } | undefined {
  const memoire = firstString(value?.memoire);
  return memoire ? { memoire } : undefined;
}

function normalizeCategory(value: string | undefined, fallbackText: string): NoteCategory {
  const explicit = value?.toLowerCase().trim();
  if (explicit && isCategory(explicit)) return explicit;

  const text = fallbackText.toLowerCase();
  if (/\b(research|survey|interview|insight|analysis|competitive)\b/.test(text)) return "research";
  if (/\b(connect|integration|api|notion|linear|slack|webhook)\b/.test(text)) return "connect";
  if (/\b(generate|codegen|scaffold|react native|swiftui|flutter|vue|kotlin)\b/.test(text)) return "generate";
  return "craft";
}

function normalizeActivateOn(value: string | undefined, category: NoteCategory, fallbackText: string): string {
  if (value && value.trim()) return value.trim();

  const text = fallbackText.toLowerCase();
  if (category === "research") return "research-to-dashboard";
  if (category === "generate") return "component-creation";
  if (category === "connect") return "always";
  if (/\b(audit|review|validate|check|analy[sz]e|inspect|accessibility)\b/.test(text)) return "design-review";
  if (/\b(prototype|motion|animation|transition)\b/.test(text)) return "prototype-creation";
  return "design-creation";
}

function normalizeFreedomLevel(
  value: string | undefined,
  fallbackText: string,
  disableModelInvocation = false,
): FreedomLevel {
  const explicit = value?.toLowerCase().trim();
  if (explicit && isFreedomLevel(explicit)) return explicit;
  if (disableModelInvocation) return "reference";

  const text = fallbackText.toLowerCase();
  if (/\b(read\s*only|read-only|analysis only|report only)\b/.test(text)) return "read-only";
  if (/\b(reference|reference only)\b/.test(text)) return "reference";
  return "high";
}

function parseFrontmatterBlock(source: string): Record<string, unknown> {
  const lines = source.split(/\r?\n/);
  const { value } = parseYamlObject(lines, 0, 0);
  return value;
}

function parseYamlObject(
  lines: string[],
  startIndex: number,
  indentLevel: number,
): { value: Record<string, unknown>; nextIndex: number } {
  const result: Record<string, unknown> = {};
  let i = startIndex;

  while (i < lines.length) {
    const rawLine = lines[i];
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) {
      i++;
      continue;
    }

    const lineIndent = countIndent(rawLine);
    if (lineIndent < indentLevel) break;
    if (lineIndent > indentLevel) break;

    const line = rawLine.slice(indentLevel);
    const colonIndex = line.indexOf(":");
    if (colonIndex < 0) {
      i++;
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    const rawValue = line.slice(colonIndex + 1).trim();

    if (!key) {
      i++;
      continue;
    }

    if (rawValue === "|" || rawValue === ">") {
      const { value, nextIndex } = parseBlockScalar(lines, i + 1, indentLevel, rawValue === ">");
      result[key] = value;
      i = nextIndex;
      continue;
    }

    if (rawValue === "") {
      const nextLine = findNextNonEmptyLine(lines, i + 1);
      if (nextLine && countIndent(nextLine.line) > indentLevel) {
        const nestedIndent = countIndent(nextLine.line);
        const { value, nextIndex } = parseYamlObject(lines, i + 1, nestedIndent);
        result[key] = value;
        i = nextIndex;
        continue;
      }

      result[key] = "";
      i++;
      continue;
    }

    result[key] = parseScalar(rawValue);
    i++;
  }

  return { value: result, nextIndex: i };
}

function parseBlockScalar(
  lines: string[],
  startIndex: number,
  parentIndent: number,
  fold: boolean,
): { value: string; nextIndex: number } {
  const chunks: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      chunks.push("");
      i++;
      continue;
    }

    const indent = countIndent(line);
    if (indent <= parentIndent) break;
    chunks.push(line.slice(indent));
    i++;
  }

  const text = fold ? foldText(chunks) : chunks.join("\n").replace(/\s+$/, "");
  return { value: text, nextIndex: i };
}

function foldText(lines: string[]): string {
  const paragraphs: string[] = [];
  let current: string[] = [];

  const flush = () => {
    const text = current.join(" ").replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
    current = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }
    current.push(line.trim());
  }

  flush();
  return paragraphs.join("\n\n");
}

function parseScalar(raw: string): unknown {
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      return JSON.parse(raw);
    } catch {
      // Preserve the raw string if it is not valid JSON.
    }
  }
  if (raw.startsWith("\"") && raw.endsWith("\"")) {
    return raw.slice(1, -1).replace(/\\"/g, "\"");
  }
  if (raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  if (raw === "null" || raw === "~") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return parseInlineArray(raw.slice(1, -1));
  }
  return raw;
}

function parseInlineArray(raw: string): unknown[] {
  const items: string[] = [];
  let current = "";
  let quote: "'" | "\"" | null = null;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (quote) {
      current += char;
      if (char === quote && raw[i - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === "\"") {
      quote = char;
      current += char;
      continue;
    }

    if (char === ",") {
      items.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) items.push(current.trim());
  return items.map((item) => parseScalar(item)).filter((item): item is unknown => item !== undefined);
}

function normalizeStringArray(...values: unknown[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          result.push(item.trim());
        }
      }
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        result.push(...normalizeStringArray(parseScalar(trimmed)));
      } else {
        result.push(trimmed);
      }
    }
  }

  return Array.from(new Set(result));
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return undefined;
}

function firstRecord(...values: unknown[]): Record<string, unknown> | undefined {
  for (const value of values) {
    const record = asRecord(value);
    if (record) return record;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function extractFirstMeaningfulBodyLine(body: string): string | undefined {
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      const heading = trimmed.replace(/^#+\s*/, "").trim();
      if (heading) return heading;
      continue;
    }
    return trimmed;
  }
  return undefined;
}

function normalizeDisplayName(value: string): string {
  return value
    .replace(/[._/]+/g, " ")
    .replace(/[-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : word)
    .join(" ");
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[’'"]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return slug || "workspace-skill";
}

function isCategory(value: string): value is NoteCategory {
  return VALID_CATEGORIES.includes(value as NoteCategory);
}

function isFreedomLevel(value: string): value is FreedomLevel {
  return VALID_FREEDOM_LEVELS.includes(value as FreedomLevel);
}

function countIndent(line: string): number {
  return line.length - line.trimStart().length;
}

function findNextNonEmptyLine(lines: string[], startIndex: number): { line: string; index: number } | null {
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].trim()) {
      return { line: lines[i], index: i };
    }
  }
  return null;
}
