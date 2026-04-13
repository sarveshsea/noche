/**
 * Penpot client tests — verifies SSRF guard, token extraction,
 * and error handling for the Penpot REST API client.
 */

import { describe, expect, it } from "vitest";
import { pullFromPenpot, type PenpotConfig } from "../penpot-client.js";

describe("Penpot client", () => {
  const validConfig: PenpotConfig = {
    baseUrl: "https://design.penpot.app",
    token: "test-token",
    fileId: "test-file-id",
  };

  describe("SSRF guard", () => {
    it("rejects localhost base URL", async () => {
      await expect(pullFromPenpot({
        ...validConfig,
        baseUrl: "http://localhost:8080",
      })).rejects.toThrow("private/loopback");
    });

    it("rejects private IPv4 ranges", async () => {
      await expect(pullFromPenpot({
        ...validConfig,
        baseUrl: "http://192.168.1.1",
      })).rejects.toThrow("private/loopback");
    });

    it("rejects 127.0.0.1", async () => {
      await expect(pullFromPenpot({
        ...validConfig,
        baseUrl: "http://127.0.0.1:3000",
      })).rejects.toThrow("private/loopback");
    });

    it("rejects 10.x.x.x ranges", async () => {
      await expect(pullFromPenpot({
        ...validConfig,
        baseUrl: "http://10.0.0.1",
      })).rejects.toThrow("private/loopback");
    });

    it("rejects non-http protocols", async () => {
      await expect(pullFromPenpot({
        ...validConfig,
        baseUrl: "ftp://design.penpot.app",
      })).rejects.toThrow("http(s)");
    });

    it("rejects invalid URLs", async () => {
      await expect(pullFromPenpot({
        ...validConfig,
        baseUrl: "not-a-url",
      })).rejects.toThrow("Invalid");
    });
  });

  describe("config validation", () => {
    it("requires fileId for pull", async () => {
      await expect(pullFromPenpot({
        baseUrl: "https://design.penpot.app",
        token: "test-token",
      })).rejects.toThrow("PENPOT_FILE_ID");
    });
  });
});
