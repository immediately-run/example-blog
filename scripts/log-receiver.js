const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 7703;
const LOG_FILE = path.join(__dirname, "../browser-logs.json");

// Clean existing log file on start
fs.writeFileSync(LOG_FILE, "[]", "utf-8");

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/log") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const log = JSON.parse(body);
        
        // Print to console beautifully
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        let color = "\x1b[0m"; // reset
        if (log.type === "error" || log.type === "exception") {
          color = "\x1b[31m"; // red
        } else if (log.type === "warn") {
          color = "\x1b[33m"; // yellow
        } else if (log.type === "log") {
          color = "\x1b[36m"; // cyan
        }

        console.log(`${color}[Browser ${log.type.toUpperCase()}] [${timestamp}] ${log.message}\x1b[0m`);
        if (log.stack) {
          console.log(`\x1b[90m${log.stack}\x1b[0m`);
        }

        // Save to file
        const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8") || "[]");
        logs.push(log);
        fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\x1b[32m[Agent Log Receiver] Listening on http://127.0.0.1:${PORT}\x1b[0m`);
});
