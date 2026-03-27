/**
 * Mémoire Notes — Downloadable skill packs for the design engine.
 */

export {
  NoteCategorySchema,
  FreedomLevelSchema,
  NoteSkillSchema,
  NoteManifestSchema,
  INTENT_TO_ACTIVATION,
  type NoteCategory,
  type FreedomLevel,
  type NoteSkill,
  type NoteManifest,
  type InstalledNote,
  type ResolvedSkill,
} from "./types.js";

export { NoteLoader } from "./loader.js";
export {
  parseSkillMarkdown,
  buildWorkspaceSkillNote,
} from "./frontmatter.js";

export {
  resolveForIntent,
  buildSkillPromptBlock,
  wrapWithNotes,
} from "./resolver.js";

export {
  installNote,
  removeNote,
  scaffoldNote,
  getNoteInfo,
} from "./installer.js";
