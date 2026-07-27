import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const chromePath =
  process.env.EXTENTIE_CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const extensionPath = resolve(process.argv[2] ?? "dist");
const iterations = Number(process.env.EXTENTIE_POPUP_ITERATIONS ?? 5);
const limitMs = Number(process.env.EXTENTIE_POPUP_LIMIT_MS ?? 300);
const profilePath = await mkdtemp(`${tmpdir()}/extentie-popup-profile-`);

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

async function waitForExtensionId(client) {
  const startedAt = performance.now();
  let lastTargetInfos = [];
  for (;;) {
    const { targetInfos } = await client.send("Target.getTargets");
    lastTargetInfos = targetInfos;
    const extensionTarget = targetInfos.find(
      ({ type, url }) =>
        type === "service_worker" &&
        url.startsWith("chrome-extension://") &&
        url.endsWith("/service-worker-loader.js"),
    );
    const extensionId = extensionTarget?.url.match(
      /^chrome-extension:\/\/([^/]+)/,
    )?.[1];
    if (extensionId) return extensionId;
    if (performance.now() - startedAt > 10_000) {
      throw new Error(
        "Loaded extension service worker was not discovered. Targets:\n" +
          lastTargetInfos
            .map(({ type, url }) => `${type}: ${url}`)
            .join("\n"),
      );
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
  }
}

async function launchChrome() {
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--user-data-dir=${profilePath}`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--remote-debugging-port=0",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  return await new Promise((resolveLaunch, reject) => {
    let stderr = "";
    const timeout = setTimeout(() => {
      chrome.kill();
      reject(new Error(`Chrome did not expose DevTools:\n${stderr}`));
    }, 10_000);

    chrome.stderr.setEncoding("utf8");
    chrome.stderr.on("data", (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolveLaunch({ chrome, webSocketUrl: match[1] });
      }
    });
    chrome.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Chrome exited before DevTools was ready (code ${code})`));
    });
  });
}

class CdpClient {
  #id = 0;
  #pending = new Map();

  constructor(url) {
    this.socket = new WebSocket(url);
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id) return;
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolveOpen, reject) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    this.socket.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
    return new Promise((resolveCommand, reject) => {
      this.#pending.set(id, { resolve: resolveCommand, reject });
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitForMeaningfulRender(client, sessionId, startedAt) {
  for (;;) {
    const result = await client.send(
      "Runtime.evaluate",
      {
        expression: `(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          const paints = performance.getEntriesByType("paint");
          return {
            ready: document.readyState === "complete" &&
              document.body?.innerText.trim().length > 0 &&
              document.body.querySelectorAll("*").length > 5,
            url: location.href,
            title: document.title,
            text: document.body?.innerText,
            textLength: document.body?.innerText.length ?? 0,
            nodeCount: document.body?.querySelectorAll("*").length ?? 0,
            navigation: navigation?.toJSON(),
            paints: paints.map((entry) => ({
              name: entry.name,
              startTime: entry.startTime,
            })),
          };
        })()`,
        returnByValue: true,
      },
      sessionId,
    );
    if (result.result.value?.ready) {
      return {
        openToMeaningfulRenderMs: performance.now() - startedAt,
        ...result.result.value,
      };
    }
    if (performance.now() - startedAt > 10_000) {
      throw new Error("Popup did not meaningfully render within 10 seconds");
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 5));
  }
}

let chrome;
let client;
try {
  const launched = await launchChrome();
  chrome = launched.chrome;
  client = new CdpClient(launched.webSocketUrl);
  await client.open();

  const extensionId = await waitForExtensionId(client);
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const results = [];

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const startedAt = performance.now();
    const { targetId } = await client.send("Target.createTarget", {
      url: popupUrl,
      background: false,
    });
    const { sessionId } = await client.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    await client.send("Runtime.enable", {}, sessionId);
    const result = await waitForMeaningfulRender(client, sessionId, startedAt);
    results.push(result);
    console.log(
      `run ${iteration}: ${result.openToMeaningfulRenderMs.toFixed(1)} ms ` +
        `(${result.nodeCount} nodes, ${result.textLength} text chars, ${result.url})`,
    );
    await client.send("Target.closeTarget", { targetId });
  }

  const timings = results.map((result) => result.openToMeaningfulRenderMs);
  const p50 = percentile(timings, 0.5);
  const p95 = percentile(timings, 0.95);
  console.log(`popup p50=${p50.toFixed(1)} ms p95=${p95.toFixed(1)} ms`);

  if (p95 > limitMs) {
    console.error(
      `FAIL: popup p95 ${p95.toFixed(1)} ms exceeds ${limitMs} ms limit`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `PASS: popup p95 ${p95.toFixed(1)} ms is within ${limitMs} ms limit`,
    );
  }
} finally {
  client?.close();
  if (chrome) {
    let didExit = chrome.exitCode !== null || chrome.signalCode !== null;
    const exited =
      didExit
        ? Promise.resolve()
        : new Promise((resolveExit) =>
            chrome.once("exit", () => {
              didExit = true;
              resolveExit();
            }),
          );
    chrome.kill();
    await Promise.race([
      exited,
      new Promise((resolveWait) => setTimeout(resolveWait, 1_000)),
    ]);
    if (!didExit) {
      chrome.kill("SIGKILL");
      await exited;
    }
  }
  await rm(profilePath, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 50,
  });
}
