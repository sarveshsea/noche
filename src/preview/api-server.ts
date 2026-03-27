/**
 * Preview API Server — Interactive preview with REST API and WebSocket hot-reload.
 *
 * Browsers connect via WebSocket for live reload notifications.
 * The server pushes `{ type: "reload", reason }` when specs or code change.
 */

import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { WebSocketServer, WebSocket } from "ws";
import type { MemoireEngine } from "../engine/core.js";
import type { MemoireEvent } from "../engine/core.js";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const MAX_PORT_RETRIES = 10;

export class PreviewApiServer {
  private engine: MemoireEngine;
  private staticDir: string;
  private port: number;
  private startPort: number;
  private server: ReturnType<typeof createServer> | null = null;
  private wss: WebSocketServer | null = null;
  private liveClients = new Set<WebSocket>();
  private onEngineEvent: ((evt: MemoireEvent) => void) | null = null;

  constructor(engine: MemoireEngine, staticDir: string, port = 3030) {
    this.engine = engine;
    this.staticDir = staticDir;
    this.port = port;
    this.startPort = port;
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        const url = new URL(req.url || "/", `http://localhost:${this.port}`);

        // API routes
        if (url.pathname.startsWith("/api/")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");

          if (url.pathname === "/api/specs") {
            try {
              const specs = await this.engine.registry.getAllSpecs();
              res.end(JSON.stringify(specs));
            } catch {
              res.end(JSON.stringify([]));
            }
            return;
          }

          if (url.pathname === "/api/tokens") {
            const tokens = this.engine.registry.designSystem;
            res.end(JSON.stringify(tokens));
            return;
          }

          if (url.pathname === "/api/status") {
            res.end(JSON.stringify({
              figma: this.engine.figma.isConnected,
            }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }

        // Static file serving
        let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
        const fullPath = join(this.staticDir, filePath);
        const ext = extname(fullPath);

        try {
          const content = await readFile(fullPath);
          res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
          res.end(content);
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain");
          res.end("Not found");
        }
      });

      // WebSocket server for live-reload
      this.wss = new WebSocketServer({ server: this.server });
      this.wss.on("connection", (ws) => {
        this.liveClients.add(ws);
        ws.on("close", () => this.liveClients.delete(ws));
        ws.on("error", () => this.liveClients.delete(ws));
      });

      // Listen for engine events that should trigger browser reload
      this.onEngineEvent = (evt: MemoireEvent) => {
        if (evt.source === "codegen" || evt.source === "auto-spec") {
          this.notifyReload(evt.message);
        }
      };
      this.engine.on("event", this.onEngineEvent);

      this.server.listen(this.port, () => {
        resolve(this.port);
      });

      this.server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          if (this.port - this.startPort >= MAX_PORT_RETRIES) {
            reject(new Error(`All preview ports ${this.startPort}-${this.port} are in use`));
            return;
          }
          this.port++;
          this.server?.listen(this.port);
        } else {
          reject(err);
        }
      });
    });
  }

  /** Push a reload signal to all connected browsers. */
  notifyReload(reason: string): void {
    const msg = JSON.stringify({ type: "reload", reason });
    for (const ws of this.liveClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  stop(): void {
    if (this.onEngineEvent) {
      this.engine.off("event", this.onEngineEvent);
      this.onEngineEvent = null;
    }
    for (const ws of this.liveClients) ws.close();
    this.liveClients.clear();
    this.wss?.close();
    this.server?.close();
  }
}
