// Minimal CDP driver for headless Edge. Node 24 global WebSocket, no deps.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), "e2e-edge-"));
  const proc = spawn(EDGE, [
    "--headless=new", `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    "about:blank",
  ], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const t = targets.find((x) => x.type === "page");
      if (t) return { proc, profile, wsUrl: t.webSocketDebuggerUrl };
    } catch {}
    await sleep(250);
  }
  proc.kill();
  rmSync(profile, { recursive: true, force: true });
  throw new Error("Edge did not expose a debugging target");
}

export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const p = m.id && pending.get(m.id);
    if (p) { pending.delete(m.id); if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result); }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  await send("Page.enable");

  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  return {
    send, evaluate,
    async navigate(url) {
      await send("Page.navigate", { url });
      await sleep(300);
      for (let i = 0; i < 100; i++) {
        if ((await evaluate("document.readyState")) === "complete") return;
        await sleep(100);
      }
    },
    async waitFor(expression, ms = 15000) {
      for (let t = 0; t < ms; t += 100) {
        try { if (await evaluate(expression)) return true; } catch {}
        await sleep(100);
      }
      return false;
    },
    setViewport: (width, height) =>
      send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }),
    setReducedMotion: (on) =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: on ? "reduce" : "no-preference" }] }),
    injectBeforeLoad: (source) => send("Page.addScriptToEvaluateOnNewDocument", { source }),
    async clickAt(x, y) {
      const p = { x, y, button: "left", clickCount: 1 };
      await send("Input.dispatchMouseEvent", { ...p, type: "mouseMoved" });
      await send("Input.dispatchMouseEvent", { ...p, type: "mousePressed" });
      await send("Input.dispatchMouseEvent", { ...p, type: "mouseReleased" });
    },
    pressEscape: async () => {
      const k = { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 };
      await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...k });
      await send("Input.dispatchKeyEvent", { type: "keyUp", ...k });
    },
    // Ask Edge to quit over CDP, then drop the socket.
    async quit() {
      try { await send("Browser.close"); } catch {} // already gone is fine
      ws.close();
    },
  };
}

// Always-run cleanup: CDP close, kill fallback, remove the temp profile.
export async function shutdown({ proc, profile }, page) {
  const exited = new Promise((r) => proc.once("exit", r));
  await page?.quit();
  setTimeout(() => proc.kill(), 3000).unref(); // fallback if Browser.close was ignored
  await Promise.race([exited, sleep(5000)]);
  proc.kill();
  await sleep(1000); // child processes release profile locks a moment later
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch (e) {
    console.log(`warning: could not remove ${profile}: ${e.code}`); // temp dir only, results unaffected
  }
}
