import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, normalize, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const browserCandidates = [
  process.env.CHROME_BIN,
  process.env.CHROMIUM_BIN,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
]);

function findBrowserBinary() {
  return browserCandidates.find((candidate) => existsSync(candidate));
}

function createStaticServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const requestedPath = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    const filePath = resolve(root, requestedPath || 'index.html');

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    try {
      const body = await readFile(filePath);
      response.writeHead(200, {
        'content-type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
}

async function listen(server) {
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine static server port.');
  }

  return address.port;
}

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${url} returned ${response.status}`);
  }

  return response.json();
}

async function waitForDebugTarget(debugPort) {
  const deadline = Date.now() + 10_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${debugPort}/json`);
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);

      if (page) {
        return page.webSocketDebuggerUrl;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  throw lastError ?? new Error('Timed out waiting for browser debug target.');
}

function connectWebSocket(url) {
  return new Promise((resolveConnect, rejectConnect) => {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => resolveConnect(socket), { once: true });
    socket.addEventListener('error', () => rejectConnect(new Error('Unable to connect to browser WebSocket.')), {
      once: true,
    });
  });
}

function createCdpClient(socket) {
  let nextId = 1;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.id && pending.has(message.id)) {
      const { resolveCall, rejectCall } = pending.get(message.id);
      pending.delete(message.id);

      if (message.error) {
        rejectCall(new Error(message.error.message));
      } else {
        resolveCall(message.result);
      }
    }
  });

  return {
    call(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));

      return new Promise((resolveCall, rejectCall) => {
        pending.set(id, { resolveCall, rejectCall });
      });
    },
    close() {
      socket.close();
    },
  };
}

async function waitForBrowserTestResult(cdp) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    const evaluation = await cdp.call('Runtime.evaluate', {
      expression: 'document.body?.dataset?.testStatus',
      returnByValue: true,
    });
    const status = evaluation.result?.value;

    if (status === 'passed') {
      return;
    }

    if (status === 'failed') {
      const failure = await cdp.call('Runtime.evaluate', {
        expression: 'document.querySelector("#status")?.textContent',
        returnByValue: true,
      });
      throw new Error(failure.result?.value ?? 'Browser smoke test failed.');
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  throw new Error('Timed out waiting for browser smoke test result.');
}

const browserBinary = findBrowserBinary();

if (!browserBinary) {
  throw new Error(
    'No Chromium or Chrome binary found. Set CHROME_BIN to run the browser smoke test.',
  );
}

const server = createStaticServer();
const port = await listen(server);
const debugPort = 9223;
const smokeUrl = `http://127.0.0.1:${port}/tests/browser-smoke.html`;
const browser = spawn(browserBinary, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${debugPort}`,
  smokeUrl,
]);

browser.stderr.on('data', (chunk) => process.stderr.write(chunk));

try {
  const webSocketUrl = await waitForDebugTarget(debugPort);
  const socket = await connectWebSocket(webSocketUrl);
  const cdp = createCdpClient(socket);
  await cdp.call('Runtime.enable');
  await waitForBrowserTestResult(cdp);
  cdp.close();
  console.log('Browser smoke test passed.');
} finally {
  browser.kill('SIGTERM');
  server.close();
}
