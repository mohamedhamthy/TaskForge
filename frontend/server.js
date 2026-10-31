import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const distDirectory = resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
const indexFile = resolve(distDirectory, "index.html");
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

function sendFile(request, response, filePath, pathname) {
  let fileStat;
  try {
    fileStat = statSync(filePath);
  } catch {
    response.writeHead(404).end("Not found");
    return;
  }
  if (!fileStat.isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Length": fileStat.size,
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": pathname === "/" || filePath === indexFile
      ? "no-cache"
      : pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  const stream = createReadStream(filePath);
  stream.on("error", () => response.destroy());
  stream.pipe(response);
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url || "/", "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  const filePath = resolve(distDirectory, `.${pathname}`);
  if (
    (filePath !== distDirectory && !filePath.startsWith(`${distDirectory}${sep}`)) ||
    pathname.includes("\0")
  ) {
    response.writeHead(404).end("Not found");
    return;
  }

  try {
    if (statSync(filePath).isFile()) {
      sendFile(request, response, filePath, pathname);
      return;
    }
  } catch {
    // Missing files can still be client-side routes.
  }

  if (extname(pathname) || pathname.startsWith("/assets/")) {
    response.writeHead(404).end("Not found");
    return;
  }
  sendFile(request, response, indexFile, pathname);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`TaskForge frontend listening on port ${port}`);
});
