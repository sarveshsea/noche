import { readFile } from "fs/promises";
import { join } from "path";
import { describe, expect, it } from "vitest";

async function readCliEntrypoint(): Promise<string> {
  return readFile(join(process.cwd(), "src", "index.ts"), "utf-8");
}

describe("CLI registration smoke test", () => {
  it("imports the hidden command registrars in the CLI entrypoint", async () => {
    const source = await readCliEntrypoint();

    expect(source).toContain('registerDoctorCommand');
    expect(source).toContain('registerDaemonCommand');
    expect(source).toContain('registerHeartbeatCommand');
  });

  it("registers doctor, daemon, and heartbeat on the root program", async () => {
    const source = await readCliEntrypoint();

    expect(source).toContain('registerDoctorCommand(program, engine);');
    expect(source).toContain('registerDaemonCommand(program, engine);');
    expect(source).toContain('registerHeartbeatCommand(program, engine);');
  });
});
