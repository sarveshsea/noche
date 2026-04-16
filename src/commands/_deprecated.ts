/**
 * Deprecation helper — emits a warning for commands slated for removal
 * in a future release. Respects --json mode (silent to stderr only) and
 * MEMOIRE_SILENCE_DEPRECATIONS env var.
 */

export function warnDeprecated(commandName: string, replacement?: string): void {
  if (process.env.MEMOIRE_SILENCE_DEPRECATIONS === "1") return;
  const isJson = process.argv.includes("--json");
  const msg = replacement
    ? `[deprecated] \`memi ${commandName}\` will be removed in a future release. Use \`memi ${replacement}\` instead.`
    : `[deprecated] \`memi ${commandName}\` will be removed in a future release.`;
  // Always go to stderr so --json stdout stays clean
  console.error(`\n  ${msg}\n  Silence with MEMOIRE_SILENCE_DEPRECATIONS=1\n`);
}
