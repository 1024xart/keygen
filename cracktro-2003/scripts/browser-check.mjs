import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const executable =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ].find(existsSync);
assert(executable, "Set CHROME_PATH to a Chromium browser executable.");
const base = process.env.TEST_URL || "http://localhost:3000";
const profile = mkdtempSync(join(tmpdir(), "sequence-browser-"));
const artifacts = resolve(".artifacts");
mkdirSync(artifacts, { recursive: true });
const browser = spawn(
  executable,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
);
let socket;
try {
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Browser did not start")),
      15000,
    );
    browser.on("error", reject);
    browser.stderr.on("data", (chunk) => {
      const match = chunk
        .toString()
        .match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolveEndpoint(match[1]);
      }
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((ready, reject) => {
    socket.addEventListener("open", ready, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let counter = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown")
      errors.push(
        message.params.exceptionDetails.text +
          ": " +
          (message.params.exceptionDetails.exception?.description || ""),
      );
    if (
      message.method === "Log.entryAdded" &&
      message.params.entry.level === "error"
    )
      errors.push(`${message.params.entry.text} ${message.params.entry.url || ""}`);
  });
  function send(method, params = {}, sessionId) {
    return new Promise((resolveCommand, reject) => {
      const id = ++counter;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout: ${method}`));
      }, 15000);
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolveCommand(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const cdp = (method, params) => send(method, params, sessionId);
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Log.enable");
  async function evaluate(expression) {
    const response = await cdp("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (response.exceptionDetails)
      throw new Error(
        response.exceptionDetails.exception?.description ||
          response.exceptionDetails.text,
      );
    return response.result.value;
  }
  async function waitFor(expression, label = expression) {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await new Promise((ready) => setTimeout(ready, 100));
    }
    throw new Error(`Timed out waiting for ${label}`);
  }
  const click = (selector) =>
    evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el || el.disabled) throw new Error('Missing or disabled: ' + ${JSON.stringify(selector)}); el.click(); })()`,
    );
  const clickText = (text) =>
    evaluate(
      `(() => { const el = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === ${JSON.stringify(text)} && !el.closest('[hidden]')); if (!el || el.disabled) throw new Error('Missing or disabled button: ' + ${JSON.stringify(text)}); el.click(); })()`,
    );
  async function screenshot(name) {
    await evaluate(
      "Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})))",
    );
    const { data } = await cdp("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    writeFileSync(join(artifacts, name + ".png"), Buffer.from(data, "base64"));
  }

  const setInput = (selector, value) =>
    evaluate(
      "(() => { const input=document.querySelector(" +
        JSON.stringify(selector) +
        "); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input," +
        JSON.stringify(value) +
        "); input.dispatchEvent(new Event('input',{bubbles:true})); })()",
    );
  const readyScene = () =>
    waitFor("document.querySelector('.scene')?.dataset.ready === 'true'");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp("Page.navigate", { url: base });
  await readyScene();
  await evaluate("document.fonts.ready");
  assert.equal(
    await evaluate("document.querySelectorAll('.scene-icon').length"),
    11,
  );
  assert(await evaluate("document.fonts.check('14px W95FA')"));
  assert(await evaluate("!document.querySelector('.art-stage img')"));
  assert.equal(
    await evaluate("document.querySelector('.scene').dataset.depth"),
    "map",
  );
  assert(
    await evaluate(
      "(async()=>{for(const [id,file] of [['forest','forest.jpg'],['lake','lake.jpg'],['hills','sequence-desktop.jpg']]){const photo=new Image(),depth=new Image();photo.src='/wallpapers/'+file;depth.src='/wallpapers/depth/'+id+'.png';await Promise.all([photo.decode(),depth.decode()]);if(Math.abs(photo.width/photo.height-depth.width/depth.height)>.005)return false;}return true;})()",
    ),
    "All depth maps load and match their photograph aspect ratios",
  );
  await screenshot("desktop");
  await evaluate(
    "document.querySelector('.scene-icons').scrollTop=innerHeight",
  );
  await waitFor(
    "document.querySelector('.scene-icons').scrollTop >= innerHeight - 2",
  );
  await screenshot("scrolled-art-icons");
  await evaluate("document.querySelector('.scene-icons').scrollTop=0");

  const sceneA = await evaluate(
    "document.querySelector('.scene').dataset.background",
  );
  const renderer = await evaluate(
    "document.querySelector('.scene').dataset.renderer",
  );
  assert(
    ["webgl", "canvas"].includes(renderer),
    "An actual dithering renderer must run",
  );
  await cdp("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: 1350,
    y: 100,
  });
  await waitFor(
    "parseFloat(document.querySelector('.scene').style.getPropertyValue('--scene-x')) < -15",
    "cursor parallax",
  );
  await screenshot("parallax");
  assert(
    await evaluate(
      "getComputedStyle(document.querySelector('.scene-icon')).cursor.includes('chrome.svg')",
    ),
  );
  await cdp("Input.dispatchMouseEvent", {
    type: "mousePressed",
    button: "left",
    clickCount: 1,
    x: 1350,
    y: 100,
  });
  await waitFor(
    "Number(document.querySelector('.scene').dataset.distortion) > .7",
  );
  await screenshot("distortion-held");
  await cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    button: "left",
    clickCount: 1,
    x: 1350,
    y: 100,
  });
  await waitFor(
    "Number(document.querySelector('.scene').dataset.distortion) < .02",
  );
  await cdp("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await waitFor(
    "document.querySelector('.scene').style.getPropertyValue('--scene-x') === '0px'",
    "reduced motion disables parallax",
  );
  await cdp("Emulation.setEmulatedMedia", { features: [] });
  await cdp("Page.reload");
  await readyScene();
  assert.notEqual(
    await evaluate("document.querySelector('.scene').dataset.background"),
    sceneA,
    "A new visit selects a different background",
  );

  assert(await evaluate("!document.querySelector('.keygen,audio,[aria-label=\"Run SEQUENCE\"]')"));
  for (const title of [
    "if_looks_could_shimmer",
    "empty_space",
    "this_was_my_first_attempt",
    "study 04",
    "dark_souls_15",
    "study 05",
    "study 06",
    "study 07",
    "study 08",
    "study 09",
  ]) {
    await click('[aria-label="Open ' + title + '"]');
    await waitFor(
      "document.querySelector('.piece-overlay:not([hidden]) .art-stage img')?.naturalWidth > 0",
    );
    assert(
      await evaluate(
        "!document.querySelector('.license-entry,.patch-required')",
      ),
    );
    await click('[aria-label="Close ' + title + '"]');
  }
  assert(await evaluate("!localStorage.getItem('seq_patches_v3')"));
  await click('[aria-label="Open dark_souls_15"]');
  for (const deviceScaleFactor of [1, 1.5, 2]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: 1800, height: 1400, deviceScaleFactor, mobile: false,
    });
    // CDP can change DPR without emitting the resize event produced by browser zoom.
    await evaluate("window.dispatchEvent(new Event('resize'))");
    await waitFor(`(() => {
      const image = document.querySelector('[role="dialog"][aria-label="dark_souls_15"] .art-stage img');
      const rect = image.getBoundingClientRect();
      return image.naturalWidth === 1024 &&
        Math.abs(rect.width * devicePixelRatio - 1024) < 2 &&
        Math.abs(rect.height * devicePixelRatio - 1024) < 2;
    })()`, `native artwork pixels at scale ${deviceScaleFactor}`);
  }
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await cdp("Page.reload");
  await readyScene();
  await click('[aria-label="Open if_looks_could_shimmer"]');
  await waitFor("document.querySelector('.art-stage img')?.naturalWidth > 0");
  await screenshot("art-view");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await screenshot("mobile-art-view");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"));
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS: background effects, scroll, reduced motion, all ten artworks open without licensing, reload and mobile.",
  );
} finally {
  socket?.close();
  browser.kill();
  await new Promise((ready) => {
    if (browser.exitCode !== null) ready();
    else {
      browser.once("exit", ready);
      setTimeout(ready, 3000);
    }
  });
  // Only the unique profile created above is removed, never an existing browser profile.
  if (profile.startsWith(join(tmpdir(), "sequence-browser-"))) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      /* Browser may still be releasing files. */
    }
  }
}
